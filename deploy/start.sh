#!/bin/sh
set -eu

if [ "${INITIALIZE_DATABASE:-false}" = "true" ]; then
    dotnet /app/import/ImportVocabulary.dll --initialize /app/content/es-russian.txt /app/appsettings.json
fi

export ASPNETCORE_URLS="http://0.0.0.0:${PORT:-10000}"
exec dotnet /app/Fluffy.Api.dll
