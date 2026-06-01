/* ==========================================================================
   1. INTERACTIVE CANVAS BACKGROUND (CIRCUIT PATTERN)
   ========================================================================== */
const canvas = document.getElementById('circuit-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let particles = [];
const maxParticles = 65;
const connectionDistance = 140;

// Mouse coordinates
let mouse = {
    x: null,
    y: null,
    radius: 120
};

// Listen to mousemove
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// Resize canvas
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// Particle Constructor
class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 2 + 1.5;
        this.isJoint = Math.random() > 0.75; // Some particles are larger "junctions"
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce on boundaries
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Interaction with mouse (repel slightly)
        if (mouse.x != null && mouse.y != null) {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                let force = (mouse.radius - dist) / mouse.radius;
                let angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * force * 1.5;
                this.y += Math.sin(angle) * force * 1.5;
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.isJoint ? this.radius * 1.8 : this.radius, 0, Math.PI * 2);
        
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            ctx.fillStyle = this.isJoint ? '#00f2fe' : 'rgba(148, 163, 184, 0.4)';
            if (this.isJoint) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00f2fe';
            }
        } else {
            ctx.fillStyle = this.isJoint ? '#4f46e5' : 'rgba(71, 85, 105, 0.2)';
            ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
    }
}

// Initialize particles
function initParticles() {
    particles = [];
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
}

// Circuit Connection Lines
function connectParticles() {
    let theme = document.documentElement.getAttribute('data-theme');
    
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectionDistance) {
                ctx.beginPath();
                
                // Draw L-shaped circuit routes instead of straight lines for ECE aesthetic
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);

                let alpha = (connectionDistance - dist) / connectionDistance * 0.12;
                if (theme === 'dark') {
                    ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
                } else {
                    ctx.strokeStyle = `rgba(79, 70, 229, ${alpha})`;
                }
                
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }
}

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
        p.update();
        p.draw();
    }
    connectParticles();
    requestAnimationFrame(animate);
}

initParticles();
animate();


/* ==========================================================================
   2. DARK & LIGHT THEME TOGGLE SWITCH
   ========================================================================== */
const themeToggle = document.getElementById('theme-toggle');

// Check local storage or system preference
const savedTheme = localStorage.getItem('theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
} else {
    document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
    let currentTheme = document.documentElement.getAttribute('data-theme');
    let targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('theme', targetTheme);
});


/* ==========================================================================
   3. MOBILE NAVIGATION HAMBURGER MENU
   ========================================================================== */
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('mobile-open');
    mobileToggle.classList.toggle('active');
    
    // Animate hamburger bars to 'X'
    const bars = mobileToggle.querySelectorAll('.bar');
    if (mobileToggle.classList.contains('active')) {
        bars[0].style.transform = 'rotate(-45deg) translate(-5px, 5px)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'rotate(45deg) translate(-5px, -5px)';
    } else {
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    }
});

// Close menu when clicking nav link
document.querySelectorAll('.nav-link, .nav-btn').forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu.classList.contains('mobile-open')) {
            navMenu.classList.remove('mobile-open');
            mobileToggle.classList.remove('active');
            const bars = mobileToggle.querySelectorAll('.bar');
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });
});


/* ==========================================================================
   4. INTERSECTION OBSERVER (METERS & SCROLL REVEALS)
   ========================================================================== */
const skillSection = document.getElementById('skills');
const skillMeters = document.querySelectorAll('.meter-fill');

const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            skillMeters.forEach(meter => {
                let targetLevel = meter.getAttribute('style').match(/--level:\s*(\d+)%/)[1];
                meter.style.width = targetLevel + '%';
            });
            skillObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

if (skillSection) {
    skillObserver.observe(skillSection);
}

// Highlight active navigation section on scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 250)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });

    // Toggle navbar style on scroll
    const navbar = document.querySelector('.navbar');
    if (pageYOffset > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


/* ==========================================================================
   5. DIAGNOSTIC HERO CONSOLE COMMAND SYSTEM
   ========================================================================== */
const consoleBody = document.getElementById('console-body');
const consoleButtons = document.querySelectorAll('.console-btn');

const consoleCommands = {
    help: () => {
        printConsoleLine("Available commands:");
        printConsoleLine("  skills   - Lists key ECE domains & core competencies");
        printConsoleLine("  metrics  - Outputs academic & scholarship highlights");
        printConsoleLine("  clear    - Flushes console frame");
    },
    skills: () => {
        printConsoleLine("Scanning stack capabilities...");
        printConsoleLine("  [Python] Advanced - ML & scripting", "text-info");
        printConsoleLine("  [C] Advanced | [C++] Intermediate - MCU firmware", "text-info");
        printConsoleLine("  [Hardware] AP boards, IMUs, Peltier coolers", "text-info");
        printConsoleLine("  [Simulation] MATLAB onramp certified, CCS IDE", "text-info");
    },
    metrics: () => {
        printConsoleLine("Scanning academic registers...");
        printConsoleLine("  Loyola-ICAM (LICET) - B.E. ECE Student", "text-success");
        printConsoleLine("  Current CGPA: 7.83 / 10.0", "text-success");
        printConsoleLine("  Mahindra World School (CBSE) alumnus", "text-success");
        printConsoleLine("  Scholarship award: Rs. 60,000 (Merit Scholar)", "text-success");
    },
    clear: () => {
        consoleBody.innerHTML = '';
        printConsoleLine("[Console Cleared. System standby.]", "text-muted");
    }
};

function printConsoleLine(text, cssClass = '') {
    const line = document.createElement('div');
    line.className = `console-line ${cssClass}`;
    line.textContent = text;
    // Insert before typing prompt line
    const promptLine = consoleBody.querySelector('.console-line:last-child');
    if (promptLine) {
        consoleBody.insertBefore(line, promptLine);
    } else {
        consoleBody.appendChild(line);
    }
    // Auto scroll down
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

consoleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cmd = e.target.getAttribute('data-cmd');
        if (consoleCommands[cmd]) {
            // Echo command
            printConsoleEcho(cmd);
            // Execute
            consoleCommands[cmd]();
        }
    });
});

function printConsoleEcho(cmd) {
    const line = document.createElement('div');
    line.className = 'console-line';
    line.innerHTML = `<span class="cmd-prompt">$</span> ${cmd}`;
    const promptLine = consoleBody.querySelector('.console-line:last-child');
    if (promptLine) {
        consoleBody.insertBefore(line, promptLine);
    } else {
        consoleBody.appendChild(line);
    }
}


/* ==========================================================================
   6. PROJECTS SYSTEM ARCHITECTURE MODALS (WITH VECTOR SVGS)
   ========================================================================== */
const projectCards = document.querySelectorAll('.project-card');
const modalOverlay = document.getElementById('project-modal');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

// Project Data Sheets
const projectDetails = {
    datanest: {
        pre: "IoT Storage System",
        title: "DATA NEST",
        description: "An offline local cloud storage server utilizing an ESP32 microcontroller configured in Access Point (AP) mode. Users connect to the 'DataNest-Secure' SSID and access a locally hosted captive web portal. Files are stored on a flash storage interface, bypassing the need for cellular data or external internet links.",
        svg: `<svg viewBox="0 0 600 240" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <!-- Client Device -->
            <rect x="30" y="70" width="100" height="70" rx="6" />
            <line x1="50" y1="140" x2="110" y2="140" />
            <line x1="80" y1="140" x2="80" y2="165" />
            <line x1="60" y1="165" x2="100" y2="165" />
            <text x="52" y="110" font-size="11" fill="currentColor" stroke="none">Client PC/Phone</text>

            <!-- RF Link -->
            <path d="M160 90 A 20 20 0 0 1 180 110" stroke-dasharray="3 3"/>
            <path d="M160 75 A 40 40 0 0 1 200 110"/>
            <text x="165" y="65" font-size="10" fill="currentColor" stroke="none">Wi-Fi AP Portal</text>

            <!-- ESP32 Node -->
            <rect x="230" y="50" width="140" height="120" rx="8" />
            <text x="278" y="80" font-size="12" font-weight="700" fill="currentColor" stroke="none">ESP32</text>
            <rect x="245" y="100" width="110" height="50" rx="4" stroke-dasharray="2 2"/>
            <text x="253" y="120" font-size="9" fill="currentColor" stroke="none">AP Mode Web Server</text>
            <text x="253" y="135" font-size="9" fill="currentColor" stroke="none">DNS Redirection</text>

            <!-- SPI Communication -->
            <line x1="370" y1="110" x2="450" y2="110" />
            <polygon points="450,110 440,105 440,115" fill="currentColor" />
            <polygon points="370,110 380,105 380,115" fill="currentColor" />
            <text x="390" y="100" font-size="9" fill="currentColor" stroke="none">SPI Bus</text>

            <!-- SD Card -->
            <polygon points="470,70 510,70 530,90 530,150 470,150" />
            <rect x="480" y="80" width="40" height="10" />
            <text x="482" y="120" font-size="10" fill="currentColor" stroke="none">SD Storage</text>
            <text x="485" y="135" font-size="9" fill="currentColor" stroke="none">(FATFS)</text>
        </svg>`,
        hardware: ["ESP32 Node MCU (Espressif Architecture)", "SPI Card Interface Module", "32GB MicroSD High Speed Flash Node", "3.7V Li-Po Cell and AP2112 Low Drop Voltage Regulator"],
        software: ["Embedded C++ (Arduino Core)", "Captive Portal DNS hijacking configurations", "FATFS system interfaces", "HTML5 & CSS3 Local File Explorer interface stored in SPIFFS"],
        code: `// Wi-Fi Access Point and Web Server Initialization
#include <WiFi.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <FS.h>
#include <SD.h>

const byte DNS_PORT = 53;
IPAddress apIP(192, 168, 4, 1);
DNSServer dnsServer;
WebServer server(80);

void setup() {
  SD.begin(5); // SPI Pin 5 Chip Select
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP("DataNest-Secure", "12345678");

  dnsServer.start(DNS_PORT, "*", apIP); // Captive Redirect
  server.on("/list", HTTP_GET, handleFileList);
  server.onNotFound([]() {
    server.send(200, "text/html", captivePortalHTML);
  });
  server.begin();
}`
    },
    vaccineguard: {
        pre: "Thermoelectric Cold Chain Preserver",
        title: "VACCINEGUARD",
        description: "A cold-chain cooling preserve system utilizing the Peltier effect. Developed at the Kongu 24h Erode Hackathon, this system aims to prevent thermal degradation of vaccines and medical vials during critical transits. Employs precision heat dissipation and real-time monitoring dashboard with automatic emergency SMS notification dispatch.",
        svg: `<svg viewBox="0 0 600 240" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <!-- DS18B20 Temp Sensor -->
            <rect x="20" y="90" width="90" height="40" rx="4" />
            <text x="30" y="115" font-size="11" fill="currentColor" stroke="none">DS18B20 Temp</text>
            
            <!-- 1-Wire Link -->
            <line x1="110" y1="110" x2="190" y2="110" />
            <text x="125" y="100" font-size="9" fill="currentColor" stroke="none">1-Wire Bus</text>

            <!-- ESP32 Controller -->
            <rect x="190" y="50" width="130" height="120" rx="8" />
            <text x="238" y="75" font-size="12" font-weight="700" fill="currentColor" stroke="none">ESP32</text>
            <text x="210" y="110" font-size="9" fill="currentColor" stroke="none">Closed-Loop PID</text>
            <text x="210" y="125" font-size="9" fill="currentColor" stroke="none">Uplink Telemetry</text>

            <!-- PWM Control -->
            <line x1="320" y1="90" x2="400" y2="90" />
            <text x="335" y="80" font-size="9" fill="currentColor" stroke="none">PWM (Gate)</text>

            <!-- Peltier Circuit -->
            <rect x="400" y="70" width="80" height="40" rx="4" />
            <text x="415" y="95" font-size="11" fill="currentColor" stroke="none">MOSFET + TEC</text>
            <line x1="440" y1="110" x2="440" y2="150" />
            <rect x="410" y="150" width="60" height="30" />
            <text x="415" y="168" font-size="9" fill="currentColor" stroke="none">Peltier Cell</text>

            <!-- SMS Alerts / Cloud API -->
            <line x1="255" y1="50" x2="255" y2="20" />
            <line x1="255" y1="20" x2="470" y2="20" />
            <polygon points="470,20 460,15 460,25" fill="currentColor" />
            <text x="280" y="15" font-size="9" fill="currentColor" stroke="none">GSM Network / SMS API Alert</text>
        </svg>`,
        hardware: ["ESP32 Node MCU", "TEC1-12706 Peltier Thermoelectric Element Module", "DS18B20 High Precision Temperature Probe Sensor", "IRFZ44N Logic Level Power MOSFET Driver", "Heatsink + 12V High CFM Cooling Fan Array"],
        software: ["Embedded C++ (Arduino Core)", "PID Algorithm closed-loop control system", "Twilio SMS API or GSM SIM800L module driver", "WebSockets client for live telemetry transmission"],
        code: `// Closed-loop PID control logic for Peltier Cooler PWM output
#include <OneWire.h>
#include <DallasTemperature.h>

const int PELTIER_PIN = 12; // MOSFET Gate
const float TARGET_TEMP = 4.0; // Target: 4 degrees Celsius

// PID Parameters
float Kp = 50.0, Ki = 1.5, Kd = 20.0;
float error, lastError, integral, derivative;

void adjustTemperature(float currentTemp) {
  error = currentTemp - TARGET_TEMP;
  integral += error;
  derivative = error - lastError;
  lastError = error;

  float output = (error * Kp) + (integral * Ki) + (derivative * Kd);
  int pwmValue = constrain((int)output, 0, 255);
  
  analogWrite(PELTIER_PIN, pwmValue); // Feed control output to MOSFET
}`
    },
    rehabpal: {
        pre: "Motion Capture Edge AI Assister",
        title: "REHABPAL",
        description: "A wearable motion-tracking sleeve designed to provide patient postural verification during recovery exercises. Developed for the Edge Impulse Hackearth Contest, the sleeve features an ESP32 and MPU6050 6-Axis Inertial Measurement Unit (IMU). High-frequency motion vectors are captured, pre-processed, and streamed to an Edge AI classifier to validate exercise kinematics.",
        svg: `<svg viewBox="0 0 600 240" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <!-- MPU6050 IMU -->
            <rect x="25" y="90" width="100" height="50" rx="5" />
            <text x="35" y="115" font-size="11" fill="currentColor" stroke="none">MPU6050 IMU</text>
            <text x="35" y="130" font-size="9" fill="currentColor" stroke="none">(6-Axis Accelerometer)</text>

            <!-- I2C Bus -->
            <line x1="125" y1="115" x2="200" y2="115" />
            <text x="145" y="105" font-size="9" fill="currentColor" stroke="none">I2C (SDA/SCL)</text>

            <!-- ESP32 Wearable Node -->
            <rect x="200" y="50" width="140" height="120" rx="8" />
            <text x="248" y="75" font-size="12" font-weight="700" fill="currentColor" stroke="none">ESP32</text>
            <text x="215" y="110" font-size="9" fill="currentColor" stroke="none">Raw Vector Buffer</text>
            <text x="215" y="125" font-size="9" fill="currentColor" stroke="none">WebSocket Client</text>

            <!-- WebSocket Data Stream -->
            <line x1="340" y1="110" x2="430" y2="110" />
            <polygon points="430,110 420,105 420,115" fill="currentColor" />
            <text x="350" y="100" font-size="9" fill="currentColor" stroke="none">WS Stream</text>

            <!-- Edge Impulse AI Model -->
            <rect x="430" y="60" width="140" height="100" rx="8" />
            <text x="448" y="90" font-size="11" font-weight="700" fill="currentColor" stroke="none">AI Classifier</text>
            <text x="442" y="115" font-size="9" fill="currentColor" stroke="none">Convolutional Neural</text>
            <text x="442" y="130" font-size="9" fill="currentColor" stroke="none">Network (Edge Impulse)</text>
        </svg>`,
        hardware: ["ESP32 Node MCU module", "MPU6050 6-Axis Inertial Measurement Unit (Gyroscopes & Accelerometers)", "Flexible Fabric wearable arm sleeve casing", "3.7V rechargeable Lipo cell"],
        software: ["Embedded C++ firmware with I2C wire interface", "Edge Impulse ML classification system for motion training", "WebSocket protocol for streaming raw IMU buffers", "Python host scripts for neural model testing"],
        code: `// I2C readings & WebSocket streaming for Wearable AI classifier
#include <Wire.h>
#include <MPU6050.h>
#include <WebSocketsClient.h>

MPU6050 mpu;
WebSocketsClient webSocket;

void setup() {
  Wire.begin();
  mpu.initialize();
  webSocket.begin("ai-server.local", 8080, "/stream");
}

void loop() {
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  
  // Format vector string: "ax,ay,az,gx,gy,gz"
  String payload = String(ax) + "," + String(ay) + "," + String(az) + "," +
                   String(gx) + "," + String(gy) + "," + String(gz);
                   
  webSocket.sendTXT(payload); // Broadcast to AI Classification Model
  delay(20); // 50Hz sample sampling interval
}`
    }
};

function populateModal(projectId) {
    const data = projectDetails[projectId];
    if (!data) return;

    modalContent.innerHTML = `
        <div class="modal-header">
            <span class="modal-pretitle">${data.pre}</span>
            <h3 class="modal-title">${data.title}</h3>
        </div>
        
        <div class="modal-body">
            <div class="modal-section-title">System Architecture Block Diagram</div>
            <div class="modal-arch-diagram">
                ${data.svg}
            </div>
            
            <div class="modal-section-title">Project Overview</div>
            <p>${data.description}</p>
            
            <div class="specs-grid">
                <div class="specs-column">
                    <h5>Hardware Components</h5>
                    <ul>
                        ${data.hardware.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                <div class="specs-column">
                    <h5>Software & Protocols</h5>
                    <ul>
                        ${data.software.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="modal-section-title">Core Firmware Code Snippet</div>
            <pre class="source-code-block"><code>${escapeHTML(data.code)}</code></pre>
        </div>
    `;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Attach event listeners to project cards
projectCards.forEach(card => {
    card.addEventListener('click', () => {
        const projectId = card.getAttribute('data-project');
        if (!projectId) return;
        populateModal(projectId);
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Disable scroll
    });
});

// Close modal triggers
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// Close modal function
function closeModal() {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = ''; // Re-enable scroll
}


/* ==========================================================================
   7. CONTACT UPLINK TRANSMISSION MOCK TELEMETRY CONSOLE
   ========================================================================== */
const uplinkForm = document.getElementById('uplink-form');
const uplinkLed = document.getElementById('uplink-led');
const uplinkStatusText = document.getElementById('uplink-status-text');
const transConsoleLogs = document.getElementById('trans-console-logs');

uplinkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get fields
    const name = document.getElementById('sender-name').value;
    const email = document.getElementById('sender-email').value;
    const message = document.getElementById('sender-message').value;

    // Reset console
    transConsoleLogs.innerHTML = '';
    
    // Transition LED to Connecting (yellow)
    uplinkLed.className = 'led-indicator connecting';
    uplinkStatusText.textContent = 'ESTABLISHING CARRIER...';
    
    // Stage logs
    const logSteps = [
        { text: `[UPLINK] Initiating handshake request from node: ${name}...`, delay: 500, class: 'text-info' },
        { text: `[RESOLVING] Access Point frequency: 868.10 MHz (LoRa Sub-GHz PHY)`, delay: 1100, class: '' },
        { text: `[UPLINK] Carrier wave detected. Handshake OK (RSSI: -62dBm)`, delay: 1800, class: 'text-success' },
        { text: `[PACKETIZING] Encapsulating text segments into JSON buffer...`, delay: 2400, class: '' },
        { text: `[BUFFER] Payload Size: ${JSON.stringify({name, email, message}).length} bytes. Multiplexing...`, delay: 3000, class: 'text-muted' },
        { text: `[UPLINK] Transmitting packet to gateway ${email}...`, delay: 3600, class: 'text-info' },
        { text: `[SYSTEM] ACK payload received. Frame sequence: 0xFD2A3.`, delay: 4200, class: 'text-success' },
        { text: `[SUCCESS] Uplink closed. Message stored in Harish's gateway database!`, delay: 4800, class: 'text-success' }
    ];

    logSteps.forEach(step => {
        setTimeout(() => {
            const line = document.createElement('div');
            line.className = `log-line ${step.class}`;
            line.textContent = step.text;
            transConsoleLogs.appendChild(line);
            transConsoleLogs.scrollTop = transConsoleLogs.scrollHeight;
            
            // On final step, change LED to green (online)
            if (step === logSteps[logSteps.length - 1]) {
                uplinkLed.className = 'led-indicator online';
                uplinkStatusText.textContent = 'TRANSMITTER ONLINE (ACK)';
                // Reset form
                uplinkForm.reset();
            }
        }, step.delay);
    });
});
