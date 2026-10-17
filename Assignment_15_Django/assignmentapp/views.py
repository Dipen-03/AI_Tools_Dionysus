from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def home(request):
    return HttpResponse("<h1>Assignment 15: Django Web App is Running Successfully!</h1>")