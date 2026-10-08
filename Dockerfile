FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY server/Fluffy.Api.csproj server/
COPY tools/ImportVocabulary/ImportVocabulary.csproj tools/ImportVocabulary/
RUN dotnet restore tools/ImportVocabulary/ImportVocabulary.csproj
COPY server/ server/
COPY tools/ImportVocabulary/ tools/ImportVocabulary/
RUN dotnet publish server/Fluffy.Api.csproj -c Release --no-restore -p:UseAppHost=false -o /out/api
RUN dotnet publish tools/ImportVocabulary/ImportVocabulary.csproj -c Release --no-restore -p:UseAppHost=false -o /out/import

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out/api/ ./
COPY --from=build /out/import/ ./import/
COPY es-russian.txt ./content/es-russian.txt
COPY deploy/start.sh ./start.sh
ENV ASPNETCORE_ENVIRONMENT=Production
ENV HttpsRedirection__Enabled=false
EXPOSE 10000
ENTRYPOINT ["/bin/sh", "/app/start.sh"]
