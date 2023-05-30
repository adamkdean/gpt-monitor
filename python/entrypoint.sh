#!/bin/bash
while true
do
  echo "$(date) Running main.py"
  python3 main.py
  sleep 900 # 15 minutes
done