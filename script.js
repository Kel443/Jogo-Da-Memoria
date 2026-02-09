
 const emojis = ['🎮', '🎮', '🚀', '🚀', '💎', '💎', '🎨', '🎨', '🔥', '🔥', '⚡', '⚡'];
        let first, second, lock = false, moves = 0, matches = 0, seconds = 0, timer;
        let isMuted = false;
        let currentSess = { name: "", id: 0 };

        window.onload = () => {
            initStats();
            updateVisitsDisplay();
            updateRankings();
            checkAdmProfile();
        };

        function initStats() {
            if(!localStorage.getItem('win7stats')) {
                localStorage.setItem('win7stats', JSON.stringify({
                    total: 0,
                    daily: {},
                    monthly: {},
                    totalTime: 0,
                    completedGames: 0
                }));
            }
        }

        function trackNewVisit() {
            let stats = JSON.parse(localStorage.getItem('win7stats'));
            const now = new Date();
            const dayKey = now.toISOString().split('T')[0];
            const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);

            stats.total++;
            stats.daily[dayKey] = (stats.daily[dayKey] || 0) + 1;
            stats.monthly[monthKey] = (stats.monthly[monthKey] || 0) + 1;

            localStorage.setItem('win7stats', JSON.stringify(stats));
            updateVisitsDisplay();
        }

        function updateVisitsDisplay() {
            let stats = JSON.parse(localStorage.getItem('win7stats'));
            const now = new Date();
            const dayKey = now.toISOString().split('T')[0];
            const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);

            document.getElementById('stat-day').innerText = stats.daily[dayKey] || 0;
            document.getElementById('stat-month').innerText = stats.monthly[monthKey] || 0;
            document.getElementById('stat-total').innerText = stats.total;

            // Cálculo da média de tempo
            if (stats.completedGames > 0) {
                const avgSecs = Math.floor(stats.totalTime / stats.completedGames);
                document.getElementById('stat-avg').innerText = 
                    `${Math.floor(avgSecs/60).toString().padStart(2,'0')}:${(avgSecs%60).toString().padStart(2,'0')}`;
            }
        }

        function openDialog(title, text) {
            document.getElementById('dlg-title').innerText = title;
            document.getElementById('dlg-text').innerText = text;
            document.getElementById('screen-overlay').classList.add('active');
            document.getElementById('dlg-msg').classList.add('active');
        }

        function closeDialog() {
            document.getElementById('screen-overlay').classList.remove('active');
            document.getElementById('dlg-msg').classList.remove('active');
        }

        function toggleMute() { isMuted = !isMuted; document.getElementById('mute-btn').innerText = isMuted ? "🔇" : "🔊"; }
        function playSound(id) { if(!isMuted) document.getElementById(id).play().catch(e=>{}); }

        function showScreen(id) {
            document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            if(id === 'win-adm-panel') renderAdmList(false);
        }

        function showPlayerList() {
            const rank = JSON.parse(localStorage.getItem('win7ranking')) || [];
            const container = document.getElementById('full-player-list');
            const others = rank.slice(3);
            if (others.length === 0) {
                container.innerHTML = "<p style='padding:10px; font-size:0.8rem;'>Apenas o TOP 3 registrado.</p>";
            } else {
                container.innerHTML = others.map((r, i) => `
                    <div class="rank-row"><span>${i + 4}º ${r.name} (#${r.id})</span><b>${r.timeStr}</b></div>
                `).join('');
            }
            showScreen('win-player-list');
        }

        function userLogon() {
            const name = document.getElementById('username').value.trim();
            const pass = document.getElementById('userpass').value.trim();
            if(!name || !pass) return openDialog("Erro de Logon", "Digite nome e senha.");

            let users = JSON.parse(localStorage.getItem('win7users')) || {};
            if(users[name] && users[name] !== pass) {
                playSound('snd-error');
                return openDialog("Erro", "Senha incorreta!");
            }
            users[name] = pass;
            localStorage.setItem('win7users', JSON.stringify(users));

            currentSess.name = name;
            currentSess.id = Math.floor(Math.random() * 9999) + 1;
            
            trackNewVisit();

            document.getElementById('win-loading').style.display = 'flex';
            playSound('snd-startup');
            setTimeout(() => {
                document.getElementById('win-loading').style.display = 'none';
                document.getElementById('active-user').innerText = name;
                document.getElementById('sess-id').innerText = currentSess.id;
                showScreen('win-game');
                initBoard();
            }, 2500);
        }

        function initBoard() {
            const board = document.getElementById('board'); board.innerHTML = '';
            emojis.sort(() => Math.random() - 0.5).forEach(e => {
                const card = document.createElement('div');
                card.className = 'card'; card.dataset.val = e;
                card.innerHTML = `<div class="front">${e}</div><div class="back"></div>`;
                card.onclick = flip; board.appendChild(card);
            });
        }

        function flip() {
            if(lock || this === first) return;
            if(seconds === 0 && !timer) startTimer();
            this.classList.add('flip');
            if(!first) { first = this; return; }
            second = this;
            if(first.dataset.val === second.dataset.val) {
                matches++; playSound('snd-success'); first = null; second = null;
                if(matches === emojis.length/2) finishGame();
            } else {
                lock = true; playSound('snd-error');
                setTimeout(() => { first.classList.remove('flip'); second.classList.remove('flip'); first = null; second = null; lock = false; }, 800);
            }
        }

        function startTimer() {
            timer = setInterval(() => {
                seconds++;
                document.getElementById('timer').innerText = `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
            }, 1000);
        }

        function finishGame() {
            clearInterval(timer);
            const timeStr = document.getElementById('timer').innerText;
            
            // Gravar tempo para média
            let stats = JSON.parse(localStorage.getItem('win7stats'));
            stats.totalTime += seconds;
            stats.completedGames++;
            localStorage.setItem('win7stats', JSON.stringify(stats));

            let rank = JSON.parse(localStorage.getItem('win7ranking')) || [];
            rank.push({ name: currentSess.name, id: currentSess.id, sec: seconds, timeStr });
            rank.sort((a,b) => a.sec - b.sec);
            localStorage.setItem('win7ranking', JSON.stringify(rank));
            
            playSound('snd-cheer');
            openDialog("Vitoria!", `Parabéns ${currentSess.name}! Tempo: ${timeStr}.`);
            setTimeout(() => location.reload(), 3000);
        }

        function checkAdmProfile() {
            const adm = JSON.parse(localStorage.getItem('win7adm'));
            if(adm) {
                document.getElementById('profile-area').innerHTML = `
                    <img src="images.jpg" class="adm-profile-img" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/d/d7/Windows_logo_-_2012.svg'">
                    <p style="font-weight:bold">${adm.name}</p>
                `;
            }
        }

        function handleAdmLogin() {
            const adm = JSON.parse(localStorage.getItem('win7adm'));
            if(adm && document.getElementById('adm-email').value === adm.email && document.getElementById('adm-pass').value === adm.pass) {
                showScreen('win-adm-panel');
            } else {
                playSound('snd-error');
                openDialog("Acesso Negado", "Credenciais inválidas.");
            }
        }

        function recoverAdm() {
            const key = document.getElementById('rec-key').value;
            const adm = JSON.parse(localStorage.getItem('win7adm'));
            if(key === 'KelDesigner' || (adm && key === adm.keyword)) {
                const newAdm = {
                    name: document.getElementById('new-adm-name').value,
                    email: document.getElementById('new-adm-email').value,
                    pass: document.getElementById('new-adm-pass').value,
                    keyword: document.getElementById('new-adm-keyword').value
                };
                localStorage.setItem('win7adm', JSON.stringify(newAdm));
                openDialog("Sucesso", "Novo administrador configurado!");
                setTimeout(() => location.reload(), 2000);
            } else {
                openDialog("Erro", "Chave incorreta!");
            }
        }

        function renderAdmList(selectMode) {
            const rank = JSON.parse(localStorage.getItem('win7ranking')) || [];
            const container = document.getElementById('adm-ranking-list');
            document.getElementById('btn-del-sel').style.display = selectMode ? 'inline-block' : 'none';
            container.innerHTML = rank.map((r, i) => `
                <div class="rank-row"><div class="item-row">
                <span>${selectMode ? `<input type="checkbox" class="adm-chk" data-idx="${i}"> ` : ''} ${r.name} (#${r.id})</span>
                <span>${r.timeStr} ${!selectMode ? `<button class="btn" onclick="deleteSingle(${i})">X</button>` : ''}</span>
                </div></div>`).join('') || "<p>Vazio.</p>";
        }

        function deleteSingle(idx) {
            let rank = JSON.parse(localStorage.getItem('win7ranking'));
            rank.splice(idx, 1);
            localStorage.setItem('win7ranking', JSON.stringify(rank));
            renderAdmList(false);
            updateRankings();
        }

        function deleteSelected() {
            let rank = JSON.parse(localStorage.getItem('win7ranking'));
            const chks = document.querySelectorAll('.adm-chk');
            const toKeep = rank.filter((_, i) => !chks[i].checked);
            localStorage.setItem('win7ranking', JSON.stringify(toKeep));
            renderAdmList(true);
            updateRankings();
        }

        function clearAllData() {
            localStorage.removeItem('win7ranking');
            renderAdmList(false);
            updateRankings();
            openDialog("Sistema", "Dados limpos.");
        }

        function resetAccess() {
            localStorage.removeItem('win7stats');
            initStats();
            updateVisitsDisplay();
            openDialog("Sistema", "Acessos zerados.");
        }

        function updateRankings() {
            const rank = JSON.parse(localStorage.getItem('win7ranking')) || [];
            document.getElementById('top3-display').innerHTML = rank.slice(0, 3).map((r, i) => `
                <div class="rank-row"><span>${i+1}º ${r.name} (#${r.id})</span><b>${r.timeStr}</b></div>
            `).join('') || "Sem recordes.";
        }