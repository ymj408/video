FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:21-jre
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system luma \
    && useradd --system --gid luma --home-dir /app luma \
    && mkdir -p /app/uploads \
    && chown -R luma:luma /app
WORKDIR /app
COPY --from=build /workspace/target/luma-studio-api.jar /app/luma-studio-api.jar
RUN chown luma:luma /app/luma-studio-api.jar
USER luma
ENV UPLOAD_DIR=/app/uploads \
    JAVA_OPTS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/luma-studio-api.jar"]
