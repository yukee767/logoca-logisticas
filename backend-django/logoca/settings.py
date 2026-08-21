"""
LogoCá Logísticas — Django settings
Usado como serviço complementar de analytics/BI e admin legado.
Integra com PostgreSQL principal, Redis e consome eventos Kafka.

Stack: Django 5 + DRF + Celery + Redis + PostgreSQL
Porta: 8001 (para não conflitar com FastAPI :8000 e Nest :3000)
Contato: logocalogisticas@contato.com
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-logoca-dev-change-in-prod")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'logoca.urls'
WSGI_APPLICATION = 'logoca.wsgi.application'

# Database — mesmo Postgres do docker-compose (logoca_db)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'logoca_db'),
        'USER': os.getenv('POSTGRES_USER', 'logoca'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'logoca123'),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
        'OPTIONS': {'connect_timeout': 5},
    }
}

# Cache — Redis (dados sensíveis/financeiros também)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://:redis123@localhost:6379/1'),
    }
}

# Celery — consome RabbitMQ (user>empresa) e publica no Kafka (admin)
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', os.getenv('RABBITMQ_URL', 'amqp://logoca:logoca123@localhost:5672//'))
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://:redis123@localhost:6379/1')
CELERY_BEAT_SCHEDULE = {
    'sync-stock-alerts-every-5m': {'task': 'analytics.tasks.check_stock_alerts', 'schedule': 300.0},
}

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ORIGIN', 'http://localhost:4200,http://localhost:3001').split(',')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticatedOrReadOnly'],
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Finance — regra LogoCá: preço venda = custo * 1.20 (20% armazenamento)
LOGOCA_MARKUP = float(os.getenv('LOGOCA_MARKUP', '0.20'))
CONTACT_EMAIL = os.getenv('CONTACT_EMAIL', 'logocalogisticas@contato.com')
