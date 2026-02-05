#!/bin/bash
# Script para automatizar git commits y push
# Uso: ./git-update.sh "mensaje del commit"

if [ -z "$1" ]; then
    echo "Error: Proporciona un mensaje de commit"
    echo "Uso: ./git-update.sh \"mensaje del commit\""
    exit 1
fi

git add .
git commit -m "$1"
git push origin main

echo "✅ Cambios subidos a GitHub: $1"