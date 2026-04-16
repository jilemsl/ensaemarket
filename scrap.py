import requests
from bs4 import BeautifulSoup
import pandas as pd
import browser_cookie3
from datetime import datetime
from supabase import create_client

# --- CONFIGURATION SUPABASE ---
SUPABASE_URL = "https://teqrycwapiiiadnxtfdv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlcXJ5Y3dhcGlpaWFkbnh0ZmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDEyNzQsImV4cCI6MjA5MTkxNzI3NH0.bvSp9HnnR04d4UHhN34XnYDTLl7jtEmb_oUY7FHyT0M"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
USER_ID = "l-id-uuid-de-l-utilisateur" # Tu le trouves dans ton panel admin ou profiles

def get_cookies():
    """Essaie de récupérer les cookies depuis différents navigateurs."""
    browsers = [
        browser_cookie3.chrome,
        browser_cookie3.firefox,
        browser_cookie3.edge,
        browser_cookie3.opera,
        browser_cookie3.brave
    ]
    
    for browser in browsers:
        try:
            # On cherche spécifiquement les cookies du domaine ENSAE
            cookies = browser(domain_name='pamplemousse.ensae.fr')
            # Test simple pour voir si on a accès
            r = requests.get('https://pamplemousse.ensae.fr/index.php?p=125', cookies=cookies, timeout=5)
            if "Nom" in r.text: # Vérifie qu'on est bien loggé (ajuste le mot clé si besoin)
                print(f"Succès avec les cookies de : {browser.__name__}")
                return cookies
        except Exception:
            continue
    return None

# --- SCRAPING ---
cookies = get_cookies()
if not cookies:
    print("Erreur : Connecte-toi à Pamplemousse sur ton navigateur d'abord.")
    exit()

url = 'https://pamplemousse.ensae.fr/index.php?p=125'
response = requests.get(url, cookies=cookies)
soup = BeautifulSoup(response.text, 'html.parser')
table = soup.find('table')

# ... (Ton code d'extraction reste le même ici pour remplir attendance_rows) ...

attendance_rows = []

for row in table.find_all('tr'):
    cols = row.find_all('td')
    if len(cols) != 3:
        continue

    date_str = cols[0].text.strip().replace("le ", "")
    status = cols[1].text.strip().lower()
    subject_full = cols[2].text.strip()
    subject = subject_full.split('(')[0].strip()

    # Parse day/month only
    try:
        date = datetime.strptime(date_str, "%d/%m à %Hh%M")
    except ValueError:
        continue

    # Assign semester based only on day/month
    month_day = (date.month, date.day)
    if (month_day >= (1, 26)) and (month_day <= (7, 1)):
        semester = 'S2'
    else:
        semester = 'S1'

    attendance_rows.append({
        "Date": date,
        "Matière": subject,
        "Absence": 1 if status == "absence" and "excusée" not in status else 0,
        "Retard": 1 if status == "retard" else 0,
        "Semester": semester
    })

# Convert to DataFrame
df = pd.DataFrame(attendance_rows)
# --- SYNCHRONISATION ---
df = pd.DataFrame(attendance_rows)


def sync_supabase(df_total):
    # Groupe par matière sans distinction de semestre
    summary = df_total.groupby('Matière')[['Absence', 'Retard']].sum().reset_index()
    
    for _, row in summary.iterrows():
        data = {
            "user_id": USER_ID,
            "matiere": row['Matière'],
            "nb_absences": int(row['Absence']),
            "nb_retards": int(row['Retard'])
        }
        # L'upsert mettra à jour la ligne si la matière existe déjà pour cet user
        supabase.table("absences").upsert(data).execute()

# Appel unique avec tout le dataframe
sync_supabase(df)
print("Données globales envoyées !")