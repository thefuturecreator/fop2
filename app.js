const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const API_KEY = 'MUCsTqvHbup9v8wq4Xxnx7TWpknMFYVYquPJAULeNsRjhLsHZGfh94bxyBw4rNQsLsCQDKLH8KfTxk5qAd9brrFU8KGKXU2Phx5x';
const PORT = process.env.PORT || 3000;

// --- 1. BACKEND: DIALPAD DATA LOGIC ---
app.get('/api/snapshot', async (req, res) => {
  try {
    const usersRes = await axios.get('https://dialpad.com/api/v2/users', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    const extensions = usersRes.data.items.map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`,
      ext: u.extension || '---',
      status: u.state === 'active' ? 'active' : 'available',
    }));
    res.json(extensions);
  } catch (err) {
    res.status(500).json({ error: "Dialpad Connection Failed" });
  }
});

// --- 2. FRONTEND: THE HUD INTERFACE ---
// We serve the HTML/React directly from this string for a single-file deployment
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dialpad HUD v2</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
            .ringing-active { animation: pulse-ring 1.5s infinite; border-color: #ef4444 !important; background: rgba(239, 68, 68, 0.1); }
            body { background-color: #0f172a; color: white; font-family: sans-serif; }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

        <script type="text/babel">
            const { useState, useEffect } = React;

            function HUD() {
                const [extensions, setExtensions] = useState([]);

                const fetchData = () => {
                    fetch('/api/snapshot')
                        .then(res => res.json())
                        .then(data => setExtensions(data))
                        .catch(e => console.error("Sync Error", e));
                };

                useEffect(() => {
                    fetchData();
                    const interval = setInterval(fetchData, 4000); // 4s Refresh
                    return () => clearInterval(interval);
                }, []);

                return (
                    <div className="p-8">
                        <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                            <div>
                                <h1 className="text-3xl font-black tracking-tighter text-white">DIALPAD MONITOR</h1>
                                <p className="text-emerald-400 text-xs font-mono uppercase tracking-widest">● API Linked & Active</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {extensions.map(ext => (
                                <div key={ext.id} className={\`p-4 rounded-lg border border-slate-700 bg-slate-800/50 transition-all \${ext.status === 'active' ? 'ringing-active' : ''}\`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-bold truncate pr-2">{ext.name}</span>
                                        <div className={\`h-2 w-2 rounded-full \${ext.status === 'active' ? 'bg-red-500' : 'bg-emerald-500'}\`} />
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 uppercase">Ext {ext.ext}</div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-[10px] font-bold py-1 px-2 rounded bg-white/5 text-slate-300">
                                            {ext.status === 'active' ? '📞 BUSY' : 'AVAILABLE'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }

            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<HUD />);
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(\`HUD running at http://localhost:\${PORT}\`));
