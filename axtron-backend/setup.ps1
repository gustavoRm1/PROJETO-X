# Uso: abra o PowerShell, navegue até esta pasta (axtron-backend) e rode:  ./setup.ps1
# Pré-requisitos: Docker instalado e em execução; Node/npm instalados.

$envFile = ".env"
$defaultEnv = @"
PORT=4000
DATABASE_URL=postgres://user:password@localhost:5432/axtron
DB_SSL=false
JWT_SECRET=supersecretjwtkey
REDIS_URL=redis://localhost:6379
UPLOAD_PATH=./uploads
"@

# 1) Criar .env se não existir
if (-not (Test-Path $envFile)) {
    $defaultEnv | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "[setup] .env criado com valores padrão (edite se quiser)."
} else {
    Write-Host "[setup] .env já existe."
}

# 2) Subir Postgres via Docker
$pgContainer = "axtron-db"
$pgExists = (docker ps -a --format '{{.Names}}' | Select-String $pgContainer)
if (-not $pgExists) {
    Write-Host "[setup] Subindo Postgres em Docker..."
    docker run -d --name $pgContainer -p 5432:5432 -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=axtron postgres:15 | Out-Null
} else {
    Write-Host "[setup] Container $pgContainer já existe. Iniciando..."
    docker start $pgContainer | Out-Null
}

# 3) Esperar Postgres responder
Write-Host "[setup] Aguardando Postgres ficar pronto..."
Start-Sleep -Seconds 8

# 4) Criar schema (copia o arquivo e aplica via psql dentro do container)
Write-Host "[setup] Aplicando schema.sql..."
docker cp "scripts/schema.sql" "${pgContainer}:/schema.sql" | Out-Null
docker exec -i $pgContainer psql -U user -d axtron -f /schema.sql

# 5) Instalar dependências Node
Write-Host "[setup] Instalando dependências npm..."
npm install

# 6) Rodar seeds
Write-Host "[setup] Rodando seeds..."
npm run seed

# 7) Iniciar backend
Write-Host "[setup] Iniciando servidor em http://localhost:4000 ..."
npm start
