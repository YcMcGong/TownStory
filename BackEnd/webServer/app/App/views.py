import json
import os
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.template import Context, Template
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect

from App.Utilities import S3Access, dynamoAccess
from pyReturn.response import status_response as sr

# Templating
from django.http import HttpResponse
from django.template import loader

# uuid
import uuid

# load model
from .models import City, Story

# time zone
from django.utils import timezone

# import endpoints
from .endpoints import endpoints

# constants
DYNAMO_STORY_TABLE = 'STORY_TABLE'
DEFAULT_COVER_IMAGE = 'https://f4.bcbits.com/img/0011621512_10.jpg'

def landing(request):
    d = {
        'data': 1234,
        'status': True
    }
    return JsonResponse(d)

def auth(request):
    return HttpResponse('auth')

def city(request):
    status = sr()
    if request.method == 'GET':
        city_name = request.GET.get('city_name')
        try:
            # city has story
            city = City.objects.get(pk=city_name)
            stories = Story.objects.filter(city=city)
        except:
            # city has no story
            stories = None
        # render stories
        template = loader.get_template('city.html')
        context = {
            'city_name': city_name,
            'stories': stories,
            'endpoints': endpoints
        }
        return HttpResponse(template.render(context, request))
    return JsonResponse(status.data)

def story(request):
    return HttpResponse('story')

def write(request):
    if request.user.is_authenticated:
        status = sr()
        if request.method == 'GET':
            template = loader.get_template('write.html')
            context = {
                'endpoints': endpoints
            }
            return HttpResponse(template.render(context, request))
        return JsonResponse(status.data)
    else:
        return redirect(endpoints['login_url'])
    

@csrf_exempt
def uploadImg(request):
    status = sr()
    file = None
    print(request.POST)
    print(request.FILES)
    if request.method == 'POST':
        image = request.FILES['image']
        url = S3Access.upload_file('fairytaler', image.file)
    status.attach_data('url', url, True)
    print(status.get_response())
    return JsonResponse(status.data)

@csrf_exempt
def uploadImgURL(request):
    status = sr()
    if request.method == 'GET':
        uploadURL, accessURL = S3Access.generate_presigned_upload_url('fairytaler')
    status.attach_data('uploadURL', uploadURL, True)
    status.attach_data('accessURL', accessURL, True)
    print(status.get_response())
    return JsonResponse(status.data)

@csrf_exempt
def uploadImgURLs(request):
    status = sr()
    if request.method == 'GET':
        imageCount = request.GET.get('imageCount')
        uploadURLs = []
        accessURLs = []
        for i in range(int(imageCount)):
            uploadURL, accessURL = S3Access.generate_presigned_upload_url('fairytaler')
            uploadURLs.append(uploadURL)
            accessURLs.append(accessURL)
    status.attach_data('uploadURLs', uploadURLs, True)
    status.attach_data('accessURLs', accessURLs, True)
    print(status.get_response())
    return JsonResponse(status.data)

@csrf_exempt
def uploadArticle(request):
    status = sr()
    if request.method == 'POST':
        title = request.POST.get('title')
        summary = request.POST.get('summary')
        article = request.POST.get('article')
        city = request.POST.get('city')
        # if city not exsit, create one
        try:
            city = City.objects.get(pk=city)
        except:
            city = City.objects.create(city=city)
        # get current user
        user = request.user
        # create story
        ID = str(uuid.uuid4())
        # use dynamoDB to store the contents
        article = json.loads(article)
        # check if there is any image and get the first one as cover
        cover_img_url = DEFAULT_COVER_IMAGE
        for item in article:
            if item[0] == 'image':
                cover_img_url = item[1]
                break
        dynamoAccess.add(DYNAMO_STORY_TABLE, 'story_id', ID, content = article)
        # save the story
        story = Story.objects.create(id = ID, city = city, author = user, title = title, summary = summary, cover = cover_img_url, date = timezone.now())
        status.attach_data('story_id', ID, isSuccess=True)
    return JsonResponse(status.data)

"""
Web Response
"""
def getStory(request):
    status = sr()
    if request.method == 'GET':
        story_id = request.GET.get('story_id')
        story = Story.objects.get(id=story_id)
        title = story.title
        summary = story.summary
        cover_url = story.cover
        author = story.author
        city = story.city
        template = loader.get_template('story.html')
        content = dynamoAccess.get_item(DYNAMO_STORY_TABLE, 'story_id', story_id)['content']
        context = {
            'title': title,
            'summary': summary,
            'content': content,
            'endpoints': endpoints,
            'cover_url': cover_url,
            'city': city,
            'author': author
        }
        return HttpResponse(template.render(context, request))
    return JsonResponse(status.data)

def test(request):
    status = sr()
    City.objects.create(city='1', city_name='2', state_name='3', country_name='4')
    return JsonResponse(status.data)
        
#landing Page Upload to post address
def landPage_Tester(request):
    status = sr()
    if request.method == 'GET':
        template = loader.get_template('landing.html')
        context = {
            'endpoints': endpoints,
            'login': request.user.is_authenticated
        }
        return HttpResponse(template.render(context, request))
    return JsonResponse(status.data)

#login upload to post address
def Login_Tester(request):
    status = sr()
    if request.method == 'GET':
        template = loader.get_template('login.html')
        context = {
            'endpoints': endpoints
        }
        return HttpResponse(template.render(context, request))
    return JsonResponse(status.data)

#about page link
def about(request):
    status = sr()
    if request.method == 'GET':
        template = loader.get_template('about.html')
        context = {
            'endpoints': endpoints
        }
        return HttpResponse(template.render(context, request))
    return JsonResponse(status.data)

#about page link
def contact(request):
    status = sr()
    if request.method == 'GET':
        template = loader.get_template('contact.html')
        context = {
            'endpoints': endpoints
        }
        return HttpResponse(template.render(context, request))
    return JsonResponse(status.data)