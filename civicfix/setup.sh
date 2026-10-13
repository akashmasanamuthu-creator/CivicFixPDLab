#!/bin/bash
# One-time setup on PythonAnywhere. Run:  bash ~/civicfix/setup.sh
cd ~/civicfix/backend
pip3.10 install --user -q -r requirements.txt
python3.10 seed.py
echo ""
echo "Done. Now paste this into your WSGI configuration file (Web tab):"
echo "-----------------------------------------------------------------"
echo "import sys, os"
echo "sys.path.insert(0, '$HOME/civicfix/backend')"
echo "os.environ['CIVICFIX_ADMIN_KEY'] = 'choose-your-own-key'"
echo "from app import app as application"
echo "-----------------------------------------------------------------"
