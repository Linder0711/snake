import os
import sqlite3
from flask import Flask, render_template, redirect, request,url_for
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, os.environ.get("DATABASE_PATH", "db/db.db"))
template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def query_db(query, args=(), one=False):
    with get_db() as conn:
        cur = conn.execute(query, args)
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if one else rv

def execute_db(query, args=()):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(query, args)
        conn.commit()
        cur.close()

@app.route('/', methods=['GET', 'POST'])
def index():

    if request.method == 'POST':
        name = request.form.get('name')
        points = request.form.get('points')
        execute_db("""
            insert into leaderboard
            (name, score, date_happened)
                   values
           (?, ?, current_date)
        """, (name,points))
        return redirect(url_for('index'))

    score = query_db("""Select name, score, date_happened from leaderboard order by score desc limit 10
                     """)
        
    return render_template('index.html'
                           ,score=score
                           )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)