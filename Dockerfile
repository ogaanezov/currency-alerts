# Сборка в три шага: интерфейс -> бэкенд с интерфейсом внутри -> лёгкий образ для запуска.

# 1. Собираем интерфейс (TypeScript -> обычные HTML, CSS и JS).
FROM node:24-alpine AS ui
WORKDIR /ui
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# 2. Собираем бэкенд. Собранный интерфейс кладём в static: Spring Boot отдаст его на "/".
FROM eclipse-temurin:25-jdk AS backend
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
# Сначала только зависимости: этот слой кешируется, пока не меняется pom.xml.
RUN ./mvnw --batch-mode dependency:go-offline
COPY src src
COPY --from=ui /ui/dist src/main/resources/static
# Тесты здесь не запускаем: им нужен Docker, а они и так проходят в CI.
RUN ./mvnw --batch-mode package -DskipTests

# 3. Образ для запуска: только Java без компилятора и готовый jar.
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --no-create-home app
COPY --from=backend /app/target/currency-alerts-*.jar app.jar
USER app
EXPOSE 8080
# Java берёт не больше 75% памяти контейнера: на бесплатном хостинге её всего 512 МБ.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
