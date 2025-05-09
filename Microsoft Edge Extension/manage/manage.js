import { cryptoUtils } from "../background-scripts/cryptoUtils.js";

const recordList = document.getElementById('recordList');
const infoBtn = document.getElementById('infoBtn');

const newHostBtn = document.getElementById('newHostBtn');

const deleteAllBtn = document.getElementById('deleteAllBtn');
deleteAllBtn.className = "btn btn-transparent btn-del"

const importBtn = document.getElementById('importBtn');
importBtn.className = "btn btn-import"

const exportBtn = document.getElementById('exportBtn');
exportBtn.className = "btn btn-export"

const jsonFileInput = document.getElementById('jsonFileInput');

// Host Modal
const hostModal = document.getElementById('hostModal');
const hostModalScheme = document.getElementById('hostModalScheme');
const hostModalBasisUrl = document.getElementById('hostModalBasisUrl');
const hostModalPort = document.getElementById('hostModalPort');
const hostModalAccessToken = document.getElementById('hostModalAccessToken');
const cancelHostModalBtn = document.getElementById('cancelHostModalBtn');
const saveHostModalBtn = document.getElementById('saveHostModalBtn');

// Task Modal
const taskModal = document.getElementById('taskModal');
const taskModalName = document.getElementById('taskModalName');
const taskModalIdentifier = document.getElementById('taskModalIdentifier');
const taskModalActive = document.getElementById('taskModalActiveToggle');
const taskModalProxyToggle = document.getElementById('taskModalProxyToggle');
const cancelTaskModalBtn = document.getElementById('cancelTaskModalBtn');
const saveTaskModalBtn = document.getElementById('saveTaskModalBtn');
let currentHostIndex = -1; // Zur Verfolgung des aktuellen Hosts beim Hinzufügen eines Tasks

// Scheduler Tasks Modal
const schedulerTasksModal = document.getElementById('schedulerTasksModal');
const schedulerTasksList = document.getElementById('schedulerTasksList');
const schedulerTasksLoader = document.getElementById('schedulerTasksLoader');
const closeSchedulerTasksModalBtn = document.getElementById('closeSchedulerTasksModalBtn');
const taskSearchInput = document.getElementById('taskSearchInput');

// Info Modal
const infoModal = document.getElementById('infoModal');
const closeInfoModalBtn = document.getElementById('closeInfoModalBtn');

let hosts = [];


// Hilfsfunktionen
function loadHosts(callback) {
    chrome.storage.local.get(['edgeBISHosts'], (res) => {
        callback(res.edgeBISHosts || []);
    });
}

function saveHosts(updatedHosts, callback) {
    chrome.storage.local.set({ edgeBISHosts: updatedHosts }, () => {
        if (callback) callback();
    });
}


// Render-Funktion
function renderHosts() {
    recordList.innerHTML = '';
    
    hosts.forEach((host, hostIndex) => {
        const hostContainer = document.createElement('div');
        hostContainer.className = 'host-container';
        
        // Host-Header erstellen
        const hostHeader = document.createElement('div');
        hostHeader.className = 'host-header';
        
        const hostInfo = document.createElement('div');
        hostInfo.className = 'host-info';
        
        const hostTitle = document.createElement('h2');
        hostTitle.textContent = `${host.basisUrl}`;
        hostTitle.className = 'host-title';
        hostInfo.appendChild(hostTitle);
        
        const hostToken = document.createElement('p');
        const decryptedToken = cryptoUtils.decryptToken(host.accessToken);
        const visiblePart = decryptedToken.substring(0, 12);
        const maskedPart = '*'.repeat(Math.max(0, decryptedToken.length - 12));
        hostToken.textContent = `Token: ${visiblePart}${maskedPart}`;
        hostToken.className = 'host-token';
        hostInfo.appendChild(hostToken);
        
        hostHeader.appendChild(hostInfo);
        
        // Host-Aktionen
        const hostActions = document.createElement('div');
        hostActions.className = 'host-actions';

        // Neuer Task Button
        const addTaskBtn = document.createElement('button');
        addTaskBtn.className = 'btn btn-primary';
        addTaskBtn.title = 'Neuen Task hinzufügen';
        addTaskBtn.innerHTML = `<span>Task hinzufügen</span>`;
        addTaskBtn.addEventListener('click', () => {
            currentHostIndex = hostIndex;
            // Öffne das Scheduler Tasks Modal und lade die verfügbaren Tasks
            schedulerTasksLoader.style.display = 'block';
            schedulerTasksList.innerHTML = '';
            schedulerTasksModal.style.display = 'block';
            // Suchfeld zurücksetzen
            if (taskSearchInput) {
                taskSearchInput.value = '';
            }
            fetchSchedulerTasks(host).then();
        });
        hostActions.appendChild(addTaskBtn);
        
        // Host bearbeiten Button
        const editHostBtn = document.createElement('button');
        editHostBtn.className = 'btn btn-icon';
        editHostBtn.title = 'Host bearbeiten';
        editHostBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
            </svg>
        `;
        editHostBtn.addEventListener('click', () => {
            hostModalScheme.value = host.scheme;
            hostModalBasisUrl.value = host.basisUrl;
            hostModalPort.value = host.port;
            hostModalAccessToken.value = cryptoUtils.decryptToken(host.accessToken);
            currentHostIndex = hostIndex;
            hostModal.style.display = 'block';
        });
        hostActions.appendChild(editHostBtn);
        
        // Host löschen Button
        const deleteHostBtn = document.createElement('button');
        deleteHostBtn.className = 'btn btn-icon';
        deleteHostBtn.title = 'Host löschen';
        deleteHostBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
            </svg>
        `;
        deleteHostBtn.addEventListener('click', () => {
            if (confirm('Möchten Sie diesen Host mit allen Tasks wirklich löschen?')) {
                hosts.splice(hostIndex, 1);
                saveHosts(hosts, () => {
                    renderHosts();
                });
            }
        });
        hostActions.appendChild(deleteHostBtn);
        
        hostHeader.appendChild(hostActions);
        hostContainer.appendChild(hostHeader);
        
        // Task-Liste für diesen Host
        const tasksList = document.createElement('div');
        tasksList.className = 'tasks-list';
        
        if (host.tasks && host.tasks.length > 0) {
            host.tasks.forEach((task, taskIndex) => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                
                // Task-Info
                const taskInfo = document.createElement('div');
                taskInfo.className = 'task-info';
                
                const taskName = document.createElement('h4');
                taskName.textContent = task.name;
                taskInfo.appendChild(taskName);
                
                const taskIdentifier = document.createElement('p');
                taskIdentifier.textContent = `Identifier: ${task.identifier}`;
                taskInfo.appendChild(taskIdentifier);
                
                // Task-Status
                //const taskStatusContainer = document.createElement('div');
                //taskStatusContainer.className = 'task-status';
                

                
                //taskStatusContainer.appendChild(activeGroup);
                
                // Task-Aktionen
                const taskActions = document.createElement('div');
                taskActions.className = 'task-actions';

                // Aktiv-Switch
                const activeGroup = document.createElement('div');
                activeGroup.className = 'switch-group';

                const activeLabel = document.createElement('label');
                activeLabel.textContent = 'Aktiv: ';
                activeLabel.htmlFor = `activeSwitch-${hostIndex}-${taskIndex}`;
                activeGroup.appendChild(activeLabel);

                const activeLabelSwitch = document.createElement('label');
                activeLabelSwitch.className = 'switch';

                const activeInput = document.createElement('input');
                activeInput.type = 'checkbox';
                activeInput.id = `activeSwitch-${hostIndex}-${taskIndex}`;
                activeInput.checked = task.isActive;
                activeInput.addEventListener('change', (e) => {
                    hosts[hostIndex].tasks[taskIndex].isActive = e.target.checked;
                    saveHosts(hosts);
                });

                const activeSlider = document.createElement('span');
                activeSlider.className = 'slider round';

                activeLabelSwitch.appendChild(activeInput);
                activeLabelSwitch.appendChild(activeSlider);
                activeGroup.appendChild(activeLabelSwitch);
                taskActions.appendChild(activeGroup);
                
                // Task löschen Button
                const deleteTaskBtn = document.createElement('button');
                deleteTaskBtn.className = 'btn btn-icon';
                deleteTaskBtn.title = 'Task löschen';
                deleteTaskBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                    </svg>
                `;
                deleteTaskBtn.addEventListener('click', () => {
                    if (confirm('Möchten Sie diesen Task wirklich löschen?')) {
                        hosts[hostIndex].tasks.splice(taskIndex, 1);
                        saveHosts(hosts, () => {
                            renderHosts();
                        });
                    }
                });
                taskActions.appendChild(deleteTaskBtn);
                
                // Task-Elemente zusammenfügen
                taskItem.appendChild(taskInfo);
                //taskItem.appendChild(taskStatusContainer);
                taskItem.appendChild(taskActions);
                tasksList.appendChild(taskItem);
            });
        } else {
            const noTasksMsg = document.createElement('p');
            noTasksMsg.className = 'no-tasks-message';
            noTasksMsg.textContent = 'Keine Tasks vorhanden. Klicken Sie auf "Task hinzufügen", um einen neuen Task hinzuzufügen.';
            tasksList.appendChild(noTasksMsg);
        }
        
        hostContainer.appendChild(tasksList);
        recordList.appendChild(hostContainer);
    });
    
    // Hinweis anzeigen, wenn keine Hosts vorhanden sind
    if (hosts.length === 0) {
        const noHostsMsg = document.createElement('div');
        noHostsMsg.className = 'no-hosts-message';
        noHostsMsg.innerHTML = `
            <p>Keine Hosts vorhanden. Klicken Sie auf "Neuer Host", um einen Host hinzuzufügen.</p>
        `;
        recordList.appendChild(noHostsMsg);
    }
}


// Host-Modal Funktionalität
newHostBtn.addEventListener('click', () => {
    hostModalScheme.value = 'https';
    hostModalBasisUrl.value = '';
    hostModalPort.value = '';
    hostModalAccessToken.value = '';
    currentHostIndex = -1;
    hostModal.style.display = 'block';
});

cancelHostModalBtn.addEventListener('click', () => {
    hostModal.style.display = 'none';
});

saveHostModalBtn.addEventListener('click', () => {
    const scheme = hostModalScheme.value;
    const basisUrl = hostModalBasisUrl.value.trim();
    const port = hostModalPort.value.trim();
    const accessToken = hostModalAccessToken.value.trim();
    
    if (!basisUrl || !port || !accessToken) {
        alert('Bitte alle Felder ausfüllen');
        return;
    }
    
    const hostData = {
        scheme: scheme,
        basisUrl: basisUrl,
        port: port,
        accessToken: cryptoUtils.encryptToken(accessToken),
        tasks: []
    };
    
    if (currentHostIndex === -1) {
        // Neuen Host hinzufügen
        hosts.push(hostData);
    } else {
        // Bestehenden Host aktualisieren
        hostData.tasks = hosts[currentHostIndex].tasks || [];
        hosts[currentHostIndex] = hostData;
    }
    
    saveHosts(hosts, () => {
        renderHosts();
        hostModal.style.display = 'none';
    });
});


// Task-Modal Funktionalität
cancelTaskModalBtn.addEventListener('click', () => {
    taskModal.style.display = 'none';
});

saveTaskModalBtn.addEventListener('click', () => {
    if (currentHostIndex === -1) {
        alert('Fehler: Kein Host ausgewählt');
        return;
    }
    
    const name = taskModalName.value.trim();
    const identifier = taskModalIdentifier.value.trim();
    const isActive = taskModalActive.checked;
    const useProxy = taskModalProxyToggle.checked;
    
    if (!name || !identifier) {
        alert('Bitte alle Felder ausfüllen');
        return;
    }
    
    const host = hosts[currentHostIndex];
    const fullUrl = `${host.scheme}://${host.basisUrl}:${host.port}`;
    
    const taskData = {
        name: name,
        identifier: identifier,
        isActive: isActive,
        useProxy: useProxy,
        fullUrl: fullUrl
    };
    
    if (!host.tasks) {
        host.tasks = [];
    }
    
    host.tasks.push(taskData);
    
    saveHosts(hosts, () => {
        renderHosts();
        taskModal.style.display = 'none';
    });
});


// Info-Modal
infoBtn.addEventListener('click', () => {
    infoModal.style.display = 'block';
});

closeInfoModalBtn.addEventListener('click', () => {
    infoModal.style.display = 'none';
});


// Lösche alle Hosts
deleteAllBtn.addEventListener('click', () => {
    if (confirm('Möchten Sie wirklich alle Hosts und Tasks löschen?')) {
        hosts = [];
        saveHosts(hosts, () => {
            renderHosts();
        });
    }
});


// Import/Export Funktionalität
importBtn.addEventListener('click', () => {
    jsonFileInput.click();
});

jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const jsonData = JSON.parse(event.target.result);
            if (Array.isArray(jsonData)) {
                // Validierung der importierten Daten
                const validHosts = jsonData.filter(host => {
                    return host.scheme && host.basisUrl && host.port && host.accessToken;
                });
                
                if (validHosts.length > 0) {
                    hosts = [...hosts, ...validHosts];
                    saveHosts(hosts, () => {
                        renderHosts();
                        alert(`${validHosts.length} Hosts erfolgreich importiert.`);
                    });
                } else {
                    alert('Keine gültigen Host-Daten gefunden.');
                }
            } else {
                alert('Ungültiges Dateiformat. Die Datei muss ein JSON-Array enthalten.');
            }
        } catch (error) {
            alert(`Fehler beim Import: ${error.message}`);
        }
    };
    reader.readAsText(file);
});

exportBtn.addEventListener('click', () => {
    const jsonData = JSON.stringify(hosts, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hosts_export.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
    });


// Funktion zum Abrufen der Scheduler-Tasks von der BIS API
async function fetchSchedulerTasks(host) {
    if (!host) {
        alert('Fehler: Kein Host ausgewählt');
        return;
    }
    
    const baseUrl = `${host.scheme}://${host.basisUrl}:${host.port}`;
    const endpoint = `/api/scheduler-task?filter=(%26(!(identifier%3Didentifier1))(!(name%3Dname1)))&size=2000`;
    const url = baseUrl + endpoint;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': cryptoUtils.decryptToken(host.accessToken)
            }
        });
        
        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.status}`);
        }
        
        const data = await response.json();
        renderSchedulerTasks(data, host);
    } catch (error) {
        console.error('Fehler beim Abrufen der Scheduler-Tasks:', error);
        schedulerTasksList.innerHTML = `<div class="error-message">Fehler beim Laden der Scheduler-Tasks: ${error.message}</div>`;
    } finally {
        schedulerTasksLoader.style.display = 'none';
    }
}


// Funktion zum Rendern der Scheduler-Tasks im Modal
function renderSchedulerTasks(data, host) {
    schedulerTasksList.innerHTML = '';
    
    if (!data['scheduler-task'] || data['scheduler-task'].length === 0) {
        schedulerTasksList.innerHTML = '<div class="no-tasks-message">Keine Scheduler-Tasks gefunden.</div>';
        return;
    }
    
    // Speichere die vollständige Task-Liste für die Filterung
    const allTasks = data['scheduler-task'];
    
    // Filter-Funktion für die Tasks
    const filterTasks = (searchTerm) => {
        if (!searchTerm || searchTerm.trim() === '') {
            return allTasks;
        }
        
        searchTerm = searchTerm.toLowerCase().trim();
        return allTasks.filter(task => 
            task.name.toLowerCase().includes(searchTerm) || 
            (task.identifier && task.identifier.toLowerCase().includes(searchTerm))
        );
    };
    
    // Event-Listener für das Suchfeld
    taskSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        const filteredTasks = filterTasks(searchTerm);
        displayTasks(filteredTasks, host);
    });
    
    // Funktion zum Anzeigen der gefilterten Tasks
    const displayTasks = (tasks, host) => {
        schedulerTasksList.innerHTML = '';
        
        if (tasks.length === 0) {
            schedulerTasksList.innerHTML = '<div class="no-results-message">Keine passenden Tasks gefunden.</div>';
            return;
        }
        
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'scheduler-task-item';
            
            const taskName = document.createElement('div');
            taskName.className = 'scheduler-task-name';
            taskName.textContent = task.name;
            
            const taskIdentifier = document.createElement('div');
            taskIdentifier.className = 'scheduler-task-identifier';
            taskIdentifier.textContent = `ID: ${task.identifier || 'N/A'}`;
            
            const taskInfo = document.createElement('div');
            taskInfo.className = 'scheduler-task-info';
            taskInfo.appendChild(taskName);
            taskInfo.appendChild(taskIdentifier);
            
            const addButton = document.createElement('button');
            addButton.className = 'add-task-btn';
            addButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
                </svg>
                Hinzufügen
            `;
            
            addButton.addEventListener('click', () => {
                addSchedulerTaskToHost(task, host);
            });
            
            taskItem.appendChild(taskInfo);
            taskItem.appendChild(addButton);
            schedulerTasksList.appendChild(taskItem);
        });
    };
    
    // Initial alle Tasks anzeigen
    displayTasks(allTasks, host);
}


// Funktion zum Hinzufügen eines Scheduler-Tasks zur Host-Taskliste
function addSchedulerTaskToHost(task, host) {
    if (!host || currentHostIndex === -1) {
        alert('Fehler: Kein Host ausgewählt');
        return;
    }
    
    const fullUrl = `${host.scheme}://${host.basisUrl}:${host.port}`;
    
    const taskData = {
        name: task.name,
        identifier: task.identifier,
        isActive: task.active === "true",
        useProxy: false,
        fullUrl: fullUrl
    };
    
    if (!hosts[currentHostIndex].tasks) {
        hosts[currentHostIndex].tasks = [];
    }
    
    // Prüfen, ob der Task bereits existiert
    const existingTaskIndex = hosts[currentHostIndex].tasks.findIndex(
        t => t.identifier === task.identifier
    );
    
    if (existingTaskIndex !== -1) {
        if (!confirm(`Ein Task mit dem Identifier "${task.identifier}" existiert bereits. Möchten Sie ihn überschreiben?`)) {
            return;
        }
        hosts[currentHostIndex].tasks[existingTaskIndex] = taskData;
    } else {
        hosts[currentHostIndex].tasks.push(taskData);
    }
    
    saveHosts(hosts, () => {
        alert(`Task "${task.name}" erfolgreich hinzugefügt.`);
        schedulerTasksModal.style.display = 'none';
        renderHosts();
    });
}


// Event-Listener für das Schließen des Scheduler-Tasks-Modals
closeSchedulerTasksModalBtn.addEventListener('click', () => {
    schedulerTasksModal.style.display = 'none';
});


// Modals schließen, wenn auf den Hintergrund geklickt wird
window.addEventListener('click', (ev) => {
if (ev.target === hostModal) {
    hostModal.style.display = 'none';
} else if (ev.target === taskModal) {
    taskModal.style.display = 'none';
} else if (ev.target === infoModal) {
    infoModal.style.display = 'none';
} else if (ev.target === schedulerTasksModal) {
    schedulerTasksModal.style.display = 'none';
}
});

// Beim Laden der Seite
window.addEventListener('load', () => {
    // Normale Initialisierung
    loadHosts((loadedHosts) => {
        hosts = loadedHosts;
        renderHosts();
    });
});
