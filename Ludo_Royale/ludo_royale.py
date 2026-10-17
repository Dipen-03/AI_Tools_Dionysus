"""LUDO ROYALE — a complete, single-file Python/Pygame Ludo game.

Run:
    python3 -m pip install pygame
    python3 ludo_royale.py

Controls: mouse to roll/click a token; SPACE to roll; 1–4 to pick a token;
R to restart, ESC to return to the menu.

Rules: roll six to enter, exact roll to finish, safe star/start squares,
capturing, bonus rolls for sixes/captures/finishes, and three-sixes rule.
This casual variant does not use token blockades.
"""

import math
import random
import sys
from dataclasses import dataclass

try:
    import pygame
except ImportError:
    print("Pygame is not installed. Install it using: python3 -m pip install pygame")
    sys.exit(1)

pygame.init()
WIDTH, HEIGHT = 1120, 805
FPS = 60
CELL = 42
BX, BY = 45, 101
BOARD = CELL * 15
PANEL_X = 714
PANEL_W = 359
BG = (12, 19, 36)
INK = (32, 41, 61)
WHITE = (255, 255, 255)
RED, GREEN, YELLOW, BLUE = range(4)
NAMES = ["RED", "GREEN", "YELLOW", "BLUE"]
COLORS = [(246, 78, 102), (49, 198, 141), (250, 190, 70), (78, 139, 246)]
DARK_COLORS = [(171, 47, 75), (22, 132, 97), (181, 123, 29), (41, 87, 176)]
LIGHT_COLORS = [(255, 221, 227), (213, 249, 236), (255, 243, 211), (222, 236, 255)]
STARTS = [0, 13, 26, 39]
SAFE = {0, 8, 13, 21, 26, 34, 39, 47}
HOME_YARDS = [
    [(2, 2), (2, 4), (4, 2), (4, 4)],
    [(2, 10), (2, 12), (4, 10), (4, 12)],
    [(10, 10), (10, 12), (12, 10), (12, 12)],
    [(10, 2), (10, 4), (12, 2), (12, 4)],
]
LANES = [
    [(7, col) for col in range(1, 6)],
    [(row, 7) for row in range(1, 6)],
    [(7, col) for col in range(13, 8, -1)],
    [(row, 7) for row in range(13, 8, -1)],
]
TRACK = (
    [(6, c) for c in range(1, 6)]
    + [(r, 6) for r in range(5, -1, -1)]
    + [(0, 7), (0, 8)]
    + [(r, 8) for r in range(1, 6)]
    + [(6, c) for c in range(9, 15)]
    + [(7, 14), (8, 14)]
    + [(8, c) for c in range(13, 8, -1)]
    + [(r, 8) for r in range(9, 15)]
    + [(14, 7), (14, 6)]
    + [(r, 6) for r in range(13, 8, -1)]
    + [(8, c) for c in range(5, -1, -1)]
    + [(7, 0), (6, 0)]
)
assert len(TRACK) == 52 and len(set(TRACK)) == 52

try:
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
except pygame.error as exc:
    print("Could not open the game window:", exc)
    pygame.quit()
    sys.exit(1)
pygame.display.set_caption("Ludo Royale — Python Edition")
clock = pygame.time.Clock()


def font(sz, bold=False):
    return pygame.font.SysFont("arial", sz, bold=bold)

FONTS = {s: font(s) for s in (13, 15, 17, 19, 23, 26, 32, 40, 52, 66)}
BOLD = {s: font(s, True) for s in (13, 15, 17, 19, 23, 26, 32, 40, 52, 66)}


def mix(a, b, t):
    return tuple(int(x + (y - x) * t) for x, y in zip(a, b))


def text(target, value, x, y, size=17, color=WHITE, bold=False, align="topleft"):
    f = BOLD[size] if bold else FONTS[size]
    img = f.render(str(value), True, color)
    rc = img.get_rect()
    setattr(rc, align, (round(x), round(y)))
    target.blit(img, rc)
    return rc


def rounded(target, rect, fill, radius=14, border=None, border_width=1):
    pygame.draw.rect(target, fill, rect, border_radius=radius)
    if border:
        pygame.draw.rect(target, border, rect, border_width, border_radius=radius)


def glow(target, xy, radius, color, opacity=75):
    surf = pygame.Surface((radius * 4, radius * 4), pygame.SRCALPHA)
    mid = radius * 2
    for i in range(7, 0, -1):
        rr = int(radius * (0.4 + i * 0.24))
        pygame.draw.circle(surf, (*color, max(1, opacity // (i + 3))), (mid, mid), rr)
    target.blit(surf, (int(xy[0] - mid), int(xy[1] - mid)))


def star(target, xy, outer, inner, color, n=5, rotation=-math.pi / 2):
    pts = []
    for i in range(2 * n):
        rad = outer if i % 2 == 0 else inner
        theta = rotation + i * math.pi / n
        pts.append((xy[0] + math.cos(theta) * rad, xy[1] + math.sin(theta) * rad))
    pygame.draw.polygon(target, color, pts)


def cell_center(row, col):
    return (BX + (col + 0.5) * CELL, BY + (row + 0.5) * CELL)


def pos_for(color, progress, token_id=0):
    if progress < 0:
        return cell_center(*HOME_YARDS[color][token_id])
    if progress <= 50:
        return cell_center(*TRACK[(STARTS[color] + progress) % 52])
    if progress <= 55:
        return cell_center(*LANES[color][progress - 51])
    # Each color gets a distinct position in the central finish triangle.
    center = (BX + 7.5 * CELL, BY + 7.5 * CELL)
    delta = [(-19, 0), (0, -19), (19, 0), (0, 19)][color]
    offset = [(-6, -6), (6, -6), (-6, 6), (6, 6)][token_id]
    return (center[0] + delta[0] + offset[0] * 0.63,
            center[1] + delta[1] + offset[1] * 0.63)


def ellipse_shadow(target, center, w, h, alpha=55):
    s = pygame.Surface((w + 16, h + 12), pygame.SRCALPHA)
    pygame.draw.ellipse(s, (14, 22, 40, alpha), (8, 6, w, h))
    target.blit(s, (int(center[0] - w / 2 - 8), int(center[1] - h / 2 - 6)))


def draw_piece(target, color, center, number=0, radius=17, active=False, tick=0, ghost=False):
    x, y = int(center[0]), int(center[1])
    if active:
        pulse = int(5 * (1 + math.sin(tick / 185)))
        pygame.draw.circle(target, mix(COLORS[color], WHITE, .2), (x, y), radius + 6 + pulse, 3)
    ellipse_shadow(target, (x + 1, y + radius - 1), radius * 2 + 7, 11, 65)
    pygame.draw.circle(target, DARK_COLORS[color], (x, y + 2), radius + 2)
    pygame.draw.circle(target, COLORS[color], (x, y), radius)
    pygame.draw.circle(target, mix(COLORS[color], WHITE, .55), (x - 4, y - 5), max(4, radius - 6))
    pygame.draw.circle(target, COLORS[color], (x, y), max(4, radius - 8))
    pygame.draw.circle(target, (255, 255, 255), (x - radius // 3, y - radius // 3), 3)
    text(target, str(number + 1), x, y + 1, 15, WHITE, True, "center")


def make_board():
    # Keep the board static for fast, stable 60 FPS drawing.
    s = pygame.Surface((BOARD, BOARD), pygame.SRCALPHA)
    rounded(s, pygame.Rect(0, 0, BOARD, BOARD), (230, 236, 246), 9)
    for rr in range(15):
        for cc in range(15):
            r = pygame.Rect(cc * CELL, rr * CELL, CELL, CELL)
            pygame.draw.rect(s, (251, 252, 255) if (rr + cc) % 2 else (246, 248, 252), r)
    homes = [(0, 0), (0, 9), (9, 9), (9, 0)]
    for color, (r, c) in enumerate(homes):
        q = pygame.Rect(c * CELL, r * CELL, CELL * 6, CELL * 6)
        rounded(s, q, COLORS[color], 4)
        pygame.draw.rect(s, DARK_COLORS[color], q, 3)
        inner = q.inflate(-38, -38)
        rounded(s, inner, WHITE, 17)
        pygame.draw.rect(s, LIGHT_COLORS[color], inner, 4, border_radius=17)
        for tr, tc in HOME_YARDS[color]:
            x = int((tc + .5) * CELL)
            y = int((tr + .5) * CELL)
            pygame.draw.circle(s, LIGHT_COLORS[color], (x, y), 29)
            pygame.draw.circle(s, mix(COLORS[color], WHITE, .4), (x, y), 24)
            pygame.draw.circle(s, WHITE, (x, y), 20)
            pygame.draw.circle(s, COLORS[color], (x, y), 20, 3)
        label_y = inner.bottom - 6 if r == 0 else inner.top + 6
        # Small label, intentionally away from tokens.
        text(s, NAMES[color], q.centerx, label_y, 13, DARK_COLORS[color], True,
             "midbottom" if r == 0 else "midtop")

    for idx, (r, c) in enumerate(TRACK):
        rect = pygame.Rect(c * CELL, r * CELL, CELL, CELL)
        col = (250, 252, 255) if (r + c) % 2 else (242, 246, 250)
        for player, start in enumerate(STARTS):
            if idx == start:
                col = COLORS[player]
        pygame.draw.rect(s, col, rect)
        pygame.draw.rect(s, (203, 213, 230), rect, 1)
        if idx in SAFE:
            star(s, rect.center, 11, 5.2,
                 WHITE if idx in STARTS else (164, 180, 204))
    for player, cells in enumerate(LANES):
        for i, (r, c) in enumerate(cells):
            rect = pygame.Rect(c * CELL, r * CELL, CELL, CELL)
            pygame.draw.rect(s, mix(COLORS[player], WHITE, .26 if i % 2 == 0 else .39), rect)
            pygame.draw.rect(s, mix(DARK_COLORS[player], WHITE, .45), rect, 1)
            if i == 3:
                star(s, rect.center, 8, 4, WHITE)
    cx, cy = CELL * 7.5, CELL * 7.5
    x0, x1 = 6 * CELL, 9 * CELL
    y0, y1 = 6 * CELL, 9 * CELL
    pygame.draw.polygon(s, COLORS[RED], [(x0, y0), (cx, cy), (x0, y1)])
    pygame.draw.polygon(s, COLORS[GREEN], [(x0, y0), (x1, y0), (cx, cy)])
    pygame.draw.polygon(s, COLORS[YELLOW], [(x1, y0), (x1, y1), (cx, cy)])
    pygame.draw.polygon(s, COLORS[BLUE], [(x0, y1), (cx, cy), (x1, y1)])
    star(s, (cx, cy), 16, 7.5, WHITE)
    pygame.draw.rect(s, (205, 213, 226), (0, 0, BOARD, BOARD), 3, border_radius=6)
    return s

BOARD_IMAGE = make_board()


def background(target, tick):
    for y in range(HEIGHT):
        t = y / HEIGHT
        pygame.draw.line(target, mix((9, 15, 30), (25, 35, 62), t), (0, y), (WIDTH, y))
    glow(target, (100, 90), 190, COLORS[BLUE], 19)
    glow(target, (1040, 750), 230, COLORS[RED], 18)
    glow(target, (660, 60), 160, COLORS[GREEN], 13)
    for i in range(32):
        x = int((i * 183 + 37) % WIDTH)
        y = int((i * 79 + 112 + math.sin(tick / 1400 + i) * 7) % HEIGHT)
        pygame.draw.circle(target, (59, 73, 103), (x, y), 1)


def fancy_button(target, rect, title, sub="", main=(65, 113, 225), enabled=True, hover=False):
    rect = pygame.Rect(rect)
    ellipse_shadow(target, (rect.centerx, rect.bottom - 2), rect.width - 18, 18, 85)
    fill = mix(main, WHITE, .12 if hover else 0) if enabled else (64, 75, 101)
    rounded(target, rect, fill, 15)
    pygame.draw.line(target, mix(fill, WHITE, .29), (rect.x + 17, rect.y + 2),
                     (rect.right - 17, rect.y + 2), 2)
    text(target, title, rect.centerx, rect.centery - (8 if sub else 0), 19,
         WHITE if enabled else (172, 178, 191), True, "center")
    if sub:
        text(target, sub, rect.centerx, rect.centery + 18, 13, (220, 227, 247), False, "center")


@dataclass
class Player:
    color: int
    cpu: bool = False


class Ludo:
    def __init__(self):
        self.menu = True
        self.players = []
        self.tokens = [[-1] * 4 for _ in range(4)]
        self.current = 0
        self.mode = ""
        self.phase = "ready"
        self.die = 1
        self.die_display = 1
        self.sixes = 0
        self.legal = []
        self.move = None
        self.message = ""
        self.phase_until = 0
        self.winner = None
        self.dice_started = 0
        self.dice_last = 0
        self.roll_button = pygame.Rect(PANEL_X + 24, 599, PANEL_W - 48, 65)
        self.menu_button = pygame.Rect(PANEL_X + 24, 686, (PANEL_W - 58) // 2, 42)
        self.restart_button = pygame.Rect(PANEL_X + 33 + (PANEL_W - 58) // 2, 686,
                                          (PANEL_W - 58) // 2, 42)
        self.menu_choices = [
            (pygame.Rect(WIDTH // 2 - 208, 385 + i * 80, 416, 65), label, count, cpu)
            for i, (label, count, cpu) in enumerate([
                ("SOLO  ·  VS 3 BOTS", 4, True),
                ("2 PLAYERS  ·  LOCAL", 2, False),
                ("3 PLAYERS  ·  LOCAL", 3, False),
                ("4 PLAYERS  ·  LOCAL", 4, False),
            ])
        ]

    def start(self, count, bots=False):
        selected = [RED, YELLOW] if count == 2 else [RED, GREEN, YELLOW][:count] if count == 3 else [RED, GREEN, YELLOW, BLUE]
        self.players = [Player(c, bots and c != RED) for c in selected]
        self.tokens = [[-1] * 4 for _ in range(4)]
        self.current = 0
        self.mode = "SOLO VS BOTS" if bots else f"{count} LOCAL PLAYERS"
        self.phase = "ready"
        self.die = 1
        self.die_display = random.randint(1, 6)
        self.sixes = 0
        self.legal = []
        self.move = None
        self.message = "Roll a 6 to launch your first token!"
        self.phase_until = pygame.time.get_ticks() + 750
        self.winner = None
        self.menu = False

    def player(self):
        return self.players[self.current]

    def legal_moves(self, color, die):
        result = []
        for i, p in enumerate(self.tokens[color]):
            if p == 56:
                continue
            if p == -1 and die == 6:
                result.append(i)
            elif 0 <= p and p + die <= 56:
                result.append(i)
        return result

    def roll(self, tick):
        if self.menu or self.phase != "ready" or self.winner is not None:
            return
        self.phase = "rolling"
        self.dice_started = tick
        self.dice_last = tick
        self.die_display = random.randint(1, 6)
        self.message = f"{NAMES[self.player().color].title()} is rolling…"

    def finish_roll(self, tick):
        self.die = random.randint(1, 6)
        self.die_display = self.die
        if self.die == 6:
            self.sixes += 1
            if self.sixes >= 3:
                self.message = "Third six! Turn forfeited."
                self.phase = "pass"
                self.phase_until = tick + 1100
                return
        else:
            self.sixes = 0
        color = self.player().color
        self.legal = self.legal_moves(color, self.die)
        if not self.legal:
            self.message = "No legal move. " + ("Bonus roll!" if self.die == 6 else "Next player…")
            self.phase = "pass"
            self.phase_until = tick + 950
        else:
            self.phase = "select"
            self.message = "Pick a glowing token" if not self.player().cpu else "Bot is choosing a move…"
            self.phase_until = tick + 680

    def choose_cpu_move(self):
        color = self.player().color
        evaluations = []
        for i in self.legal:
            old = self.tokens[color][i]
            new = 0 if old == -1 else old + self.die
            value = random.random() * 10
            if old == -1:
                value += 28
            if new == 56:
                value += 140
            if old >= 0:
                value += new * .32
                if new in range(51, 56):
                    value += 22
                if new <= 50:
                    sq = (STARTS[color] + new) % 52
                    if sq in SAFE:
                        value += 18
                    for opponent in self.players:
                        if opponent.color == color:
                            continue
                        for progress in self.tokens[opponent.color]:
                            if 0 <= progress <= 50 and sq not in SAFE and (STARTS[opponent.color] + progress) % 52 == sq:
                                value += 95
            evaluations.append((value, i))
        return max(evaluations)[1]

    def choose(self, i, tick):
        if self.phase != "select" or i not in self.legal:
            return
        color = self.player().color
        old = self.tokens[color][i]
        steps = 1 if old < 0 else self.die
        self.move = {"color": color, "idx": i, "steps": steps, "done": 0,
                     "started": tick, "old": old, "next": 0 if old == -1 else old + 1}
        self.phase = "moving"
        self.message = "On the move!"

    def capture(self, color, progress):
        if not 0 <= progress <= 50:
            return 0
        sq = (STARTS[color] + progress) % 52
        if sq in SAFE:
            return 0
        n = 0
        for other in self.players:
            if other.color == color:
                continue
            for idx, value in enumerate(self.tokens[other.color]):
                if 0 <= value <= 50 and (STARTS[other.color] + value) % 52 == sq:
                    self.tokens[other.color][idx] = -1
                    n += 1
        return n

    def finish_move(self, tick):
        moving = self.move
        color = moving["color"]
        progress = self.tokens[color][moving["idx"]]
        taken = self.capture(color, progress)
        home = progress == 56
        self.move = None
        if all(p == 56 for p in self.tokens[color]):
            self.winner = color
            self.phase = "win"
            self.message = f"{NAMES[color]} WINS THE GAME!"
            return
        bonus = self.die == 6 or taken > 0 or home
        if taken:
            self.message = f"Captured {taken} token{'s' if taken != 1 else ''}! Bonus roll."
        elif home:
            self.message = "Token finished! Bonus roll."
        elif self.die == 6:
            self.message = "Six! Roll again."
        else:
            self.message = "Next player's turn…"
        self.phase = "after_move"
        self.phase_until = tick + 950
        self.bonus = bonus

    def next_turn(self):
        self.current = (self.current + 1) % len(self.players)
        self.sixes = 0
        self.die_display = random.randint(1, 6)
        self.message = f"{NAMES[self.player().color].title()}'s turn! Roll the dice."
        self.phase = "ready"

    def update(self, tick):
        if self.menu or self.winner is not None:
            return
        if self.phase == "ready" and self.player().cpu and tick >= self.phase_until:
            self.roll(tick)
        elif self.phase == "rolling":
            if tick - self.dice_last > 60:
                self.dice_display = random.randint(1, 6)
                self.dice_last = tick
            if tick - self.dice_started >= 700:
                self.finish_roll(tick)
        elif self.phase == "select" and self.player().cpu and tick >= self.phase_until:
            self.choose(self.choose_cpu_move(), tick)
        elif self.phase == "moving" and self.move:
            duration = 175 if self.move["old"] < 0 else 138
            if tick - self.move["started"] >= duration:
                moving = self.move
                self.tokens[moving["color"]][moving["idx"]] = moving["next"]
                moving["done"] += 1
                moving["started"] = tick
                moving["old"] = moving["next"]
                moving["next"] = moving["old"] + 1
                if moving["done"] >= moving["steps"]:
                    self.finish_move(tick)
        elif self.phase == "pass" and tick >= self.phase_until:
            if self.die == 6 and self.sixes < 3:
                self.phase = "ready"
                self.phase_until = tick + 450
            else:
                self.next_turn()
                self.phase_until = tick + 450
        elif self.phase == "after_move" and tick >= self.phase_until:
            if self.bonus:
                self.phase = "ready"
                self.phase_until = tick + 450
                self.message = f"{NAMES[self.player().color].title()} gets another roll!"
            else:
                self.next_turn()
                self.phase_until = tick + 450

    def draw_menu(self, tick):
        background(screen, tick)
        glow(screen, (WIDTH // 2, 220), 215, COLORS[BLUE], 58)
        for i, col in enumerate(COLORS):
            x, y = WIDTH // 2 - 135 + i * 90, 153 + int(8 * math.sin(tick / 560 + i))
            draw_piece(screen, i, (x, y), i, 26, tick=tick)
        text(screen, "LUDO", WIDTH / 2 - 8, 225, 66, WHITE, True, "center")
        text(screen, "R O Y A L E", WIDTH / 2, 289, 23, (143, 189, 255), True, "center")
        text(screen, "A colorful, fully playable desktop Ludo game", WIDTH / 2, 343,
             17, (188, 204, 231), False, "center")
        mx, my = pygame.mouse.get_pos()
        for rect, label, _, _ in self.menu_choices:
            hover = rect.collidepoint(mx, my)
            fancy_button(screen, rect, label, main=(54, 79, 130), hover=hover)
        text(screen, "Roll 6 to leave home  •  Capture rivals  •  Reach the center", WIDTH / 2,
             740, 15, (155, 170, 195), False, "center")

    def draw_dice(self, x, y, tick):
        size = 120
        moving = self.phase == "rolling"
        angle = math.sin(tick / 82) * 0.065 if moving else 0
        s = pygame.Surface((160, 160), pygame.SRCALPHA)
        rounded(s, pygame.Rect(20, 20, size, size), (244, 247, 255), 23)
        pygame.draw.rect(s, (183, 194, 217), (20, 20, size, size), 3, border_radius=23)
        pygame.draw.line(s, WHITE, (45, 24), (118, 24), 3)
        slots = {
            1: [(0, 0)],
            2: [(-1, -1), (1, 1)],
            3: [(-1, -1), (0, 0), (1, 1)],
            4: [(-1, -1), (-1, 1), (1, -1), (1, 1)],
            5: [(-1, -1), (-1, 1), (0, 0), (1, -1), (1, 1)],
            6: [(-1, -1), (-1, 0), (-1, 1), (1, -1), (1, 0), (1, 1)],
        }
        for a, b in slots[self.die_display]:
            pygame.draw.circle(s, (48, 68, 111), (80 + a * 34, 80 + b * 34), 11)
            pygame.draw.circle(s, (117, 143, 198), (77 + a * 34, 77 + b * 34), 3)
        if moving:
            s = pygame.transform.rotozoom(s, angle * 100, 1 + .035 * math.sin(tick / 85))
        rect = s.get_rect(center=(int(x), int(y)))
        ellipse_shadow(screen, (x, y + 64), 118, 20, 100)
        screen.blit(s, rect)

    def draw_side(self, tick):
        # Right-hand glass-like dashboard.
        rounded(screen, pygame.Rect(PANEL_X, 101, PANEL_W, 634), (29, 40, 65), 24,
                (56, 72, 105), 2)
        text(screen, "LUDO", PANEL_X + 25, 121, 32, WHITE, True)
        text(screen, "ROYALE", PANEL_X + 144, 133, 17, (132, 187, 255), True)
        text(screen, self.mode, PANEL_X + 26, 168, 13, (151, 169, 197))

        # Player strips; active player uses an accent outline.
        for j, player in enumerate(self.players):
            c = player.color
            y = 202 + j * 65
            active = self.current == j
            card = pygame.Rect(PANEL_X + 20, y, PANEL_W - 40, 59)
            fill = (45, 60, 87) if active else (35, 47, 72)
            rounded(screen, card, fill, 13, COLORS[c] if active else (57, 70, 95), 2 if active else 1)
            pygame.draw.circle(screen, COLORS[c], (card.x + 29, card.centery), 13)
            pygame.draw.circle(screen, WHITE, (card.x + 24, card.centery - 5), 4)
            text(screen, NAMES[c], card.x + 54, y + 9, 17, WHITE, True)
            text(screen, "BOT" if player.cpu else "HUMAN", card.x + 54, y + 34,
                 13, (153, 172, 201))
            n = sum(p == 56 for p in self.tokens[c])
            text(screen, f"{n}/4 HOME", card.right - 16, card.centery, 15,
                 COLORS[c] if active else (174, 186, 207), True, "midright")

        separator = 202 + len(self.players) * 65 + 3
        pygame.draw.line(screen, (61, 79, 110), (PANEL_X + 26, separator),
                         (PANEL_X + PANEL_W - 26, separator))
        # Fixed-bottom dice, button and controls give a stable layout with 4 players.
        self.draw_dice(PANEL_X + PANEL_W / 2, 531, tick)
        color = self.player().color
        accent = COLORS[color]
        rolled = self.phase == "ready" and not self.player().cpu
        fancy_button(screen, self.roll_button, "ROLL DICE" if rolled else
                     ("CHOOSE A TOKEN" if self.phase == "select" else "ROLLING…" if self.phase == "rolling" else
                      "MOVE IN PROGRESS" if self.phase == "moving" else "WAIT FOR YOUR TURN"),
                     main=accent, enabled=rolled, hover=rolled and self.roll_button.collidepoint(pygame.mouse.get_pos()))
        for rect, caption in ((self.menu_button, "MENU"), (self.restart_button, "RESTART")):
            rounded(screen, rect, (46, 60, 86), 11, (75, 92, 123), 1)
            text(screen, caption, rect.centerx, rect.centery, 15, (219, 228, 244), True, "center")
        # Message sits underneath the board, not over interactive controls.
        rounded(screen, pygame.Rect(BX, 749, BOARD, 43), (33, 44, 70), 12,
                (57, 72, 102), 1)
        text(screen, self.message, BX + 17, 770, 15, (232, 238, 251), True, "midleft")
        text(screen, "SPACE: roll   •   1–4: token   •   R: restart   •   ESC: menu",
             PANEL_X + 9, 776, 13, (165, 180, 208), False, "midleft")

    def token_locations(self, tick):
        locations = {}
        groups = {}
        for player in self.players:
            c = player.color
            for i, progress in enumerate(self.tokens[c]):
                loc = pos_for(c, progress, i)
                locations[(c, i)] = loc
                if 0 <= progress <= 55:
                    key = (round(loc[0]), round(loc[1]))
                    groups.setdefault(key, []).append((c, i))
        # Spread stacked tokens slightly for visibility/clickability.
        offsets = [(0, 0), (-10, -10), (10, 10), (-10, 10), (10, -10)]
        for group in groups.values():
            if len(group) > 1:
                for index, key in enumerate(group):
                    off = offsets[index + 1 if len(group) <= 4 else index % 5]
                    center = locations[key]
                    locations[key] = (center[0] + off[0], center[1] + off[1])
        if self.move:
            moving = self.move
            c, i = moving["color"], moving["idx"]
            duration = 175 if moving["old"] < 0 else 138
            frac = max(0, min(1, (tick - moving["started"]) / duration))
            eased = frac * frac * (3 - 2 * frac)
            a = pos_for(c, moving["old"], i)
            b = pos_for(c, moving["next"], i)
            locations[(c, i)] = (a[0] + (b[0] - a[0]) * eased,
                                 a[1] + (b[1] - a[1]) * eased - 13 * math.sin(frac * math.pi))
        return locations

    def draw_game(self, tick):
        background(screen, tick)
        text(screen, "LUDO ROYALE", BX + 5, 38, 26, WHITE, True)
        text(screen, "PYTHON EDITION", BX + BOARD - 5, 42, 15,
             (172, 198, 232), False, "topright")
        # Board drop shadow.
        rounded(screen, pygame.Rect(BX - 8, BY - 7, BOARD + 16, BOARD + 19),
                (5, 11, 23), 13)
        screen.blit(BOARD_IMAGE, (BX, BY))
        locations = self.token_locations(tick)
        for player in self.players:
            c = player.color
            for i, progress in enumerate(self.tokens[c]):
                key = (c, i)
                chosen = self.phase == "select" and c == self.player().color and i in self.legal
                center = locations[key]
                draw_piece(screen, c, center, i, 16, chosen, tick)
        self.last_locations = locations
        self.draw_side(tick)
        if self.winner is not None:
            veil = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            veil.fill((7, 13, 27, 195))
            screen.blit(veil, (0, 0))
            for i in range(62):
                xx = (i * 229 + int(tick * (0.03 + i % 4 * .008))) % WIDTH
                yy = (i * 131 + int(tick * (0.045 + i % 7 * .009))) % HEIGHT
                pygame.draw.rect(screen, COLORS[i % 4], (xx, yy, 8, 15), border_radius=2)
            cx = WIDTH // 2
            glow(screen, (cx, HEIGHT / 2), 180, COLORS[self.winner], 95)
            star(screen, (cx, 275), 62, 31, (255, 215, 109))
            text(screen, "CHAMPION!", cx, 376, 52, WHITE, True, "center")
            text(screen, f"{NAMES[self.winner]} WINS", cx, 441, 32,
                 COLORS[self.winner], True, "center")
            text(screen, "Press R to play again or ESC for menu", cx, 508, 19,
                 (211, 227, 246), False, "center")

    def clicked(self, where, tick):
        if self.menu:
            for rect, _, count, bots in self.menu_choices:
                if rect.collidepoint(where):
                    self.start(count, bots)
                    return
            return
        if self.menu_button.collidepoint(where):
            self.menu = True
            return
        if self.restart_button.collidepoint(where):
            self.start(len(self.players), self.mode == "SOLO VS BOTS")
            return
        if self.player().cpu:
            return
        if self.phase == "ready" and self.roll_button.collidepoint(where):
            self.roll(tick)
        elif self.phase == "select":
            c = self.player().color
            for i in self.legal:
                x, y = self.last_locations[(c, i)]
                if (where[0] - x) ** 2 + (where[1] - y) ** 2 <= 25 ** 2:
                    self.choose(i, tick)
                    return


def main():
    game = Ludo()
    while True:
        tick = pygame.time.get_ticks()
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if game.menu:
                        pygame.quit()
                        return
                    game.menu = True
                elif event.key == pygame.K_r and not game.menu:
                    game.start(len(game.players), game.mode == "SOLO VS BOTS")
                elif event.key == pygame.K_SPACE and not game.menu and not game.player().cpu:
                    game.roll(tick)
                elif pygame.K_1 <= event.key <= pygame.K_4 and not game.menu and not game.player().cpu:
                    game.choose(event.key - pygame.K_1, tick)
            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                game.clicked(event.pos, tick)
        game.update(tick)
        if game.menu:
            game.draw_menu(tick)
        else:
            game.draw_game(tick)
        pygame.display.flip()
        clock.tick(FPS)


if __name__ == "__main__":
    main()
