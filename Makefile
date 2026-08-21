.PHONY: up down logs build ps health nest fastapi angular next django k8s-apply k8s-logs clean

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build

ps:
	docker compose ps

health:
	@echo "== Nest ==" && curl -s http://localhost:3000/health | head -c 500; echo
	@echo "== FastAPI ==" && curl -s http://localhost:8000/health | head -c 500; echo
	@echo "== Django ==" && curl -s http://localhost:8001/health/ | head -c 500; echo
	@echo "== Angular ==" && curl -s -I http://localhost:4200 | head -n 5
	@echo "== Next ==" && curl -s -I http://localhost:3001 | head -n 5

nest:
	cd backend-nest && npm run start:dev

fastapi:
	cd backend-fastapi && uvicorn app.main:app --reload --port 8000

angular:
	cd frontend-angular && npm start

next:
	cd frontend-next && npm run dev

django:
	cd backend-django && python manage.py runserver 8001

k8s-apply:
	kubectl apply -f infra/kubernetes/namespace.yaml
	kubectl apply -f infra/kubernetes/configmap.yaml
	kubectl apply -f infra/kubernetes/secrets.yaml
	kubectl create configmap postgres-init --from-file=infra/postgres/init.sql -n logoca --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f infra/kubernetes/postgres-statefulset.yaml
	kubectl apply -f infra/kubernetes/redis-deployment.yaml
	kubectl apply -f infra/kubernetes/rabbitmq-deployment.yaml
	kubectl apply -f infra/kubernetes/kafka-deployment.yaml
	kubectl apply -f infra/kubernetes/ignite-deployment.yaml
	kubectl apply -f infra/kubernetes/nest-deployment.yaml
	kubectl apply -f infra/kubernetes/fastapi-deployment.yaml
	kubectl apply -f infra/kubernetes/angular-deployment.yaml
	kubectl apply -f infra/kubernetes/next-deployment.yaml
	kubectl apply -f infra/kubernetes/ingress.yaml

k8s-logs:
	kubectl logs -f deploy/backend-nest -n logoca

clean:
	docker compose down -v
	rm -rf backend-nest/dist backend-nest/node_modules frontend-next/.next frontend-next/node_modules frontend-angular/dist

seed-info:
	@echo "Seeds: Brahma(5) + Pepsi(5) + LogoCá(2) = 12 produtos"
	@echo "Warehouses: 3 CDs (SP, Campinas, Santos)"
	@echo "Trucks: 3 (BRA2E19, PEX8A32, LOG1C41)"
	@echo "Contato: logocalogisticas@contato.com"
