const fs = require('fs');
const path = require('path');

/**
 * Gera um relatório HTML a partir dos dados JSON do K6
 * Este script transforma os dados coletados pelo k6 em um arquivo HTML visual
 * facilitando a análise de métricas de desempenho, latência e sucesso das requisições.
 */

function generateHTMLReport() {
  const resultsPath = path.join(__dirname, '../k6/results.json');
  
  if (!fs.existsSync(resultsPath)) {
    console.log('⚠️  Arquivo de resultados não encontrado. Execute o teste K6 primeiro:');
    console.log('   k6 run --out json=test/k6/results.json test/k6/performance.js');
    process.exit(1);
  }

  const data = fs.readFileSync(resultsPath, 'utf8');
  const lines = data.split('\n').filter(line => line.trim());
  
  // Análise dos dados JSON
  let metrics = {
    totalRequests: 0,
    failedRequests: 0,
    successRequests: 0,
    avgDuration: 0,
    minDuration: Infinity,
    maxDuration: 0,
    p95Duration: 0,
    durations: [],
    checks: {},
    scenarios: {}
  };

  lines.forEach(line => {
    try {
      const obj = JSON.parse(line);
      
      if (obj.type === 'Point' && obj.metric === 'http_req_duration') {
        metrics.totalRequests++;
        metrics.durations.push(obj.data.value);
        metrics.avgDuration += obj.data.value;
        metrics.minDuration = Math.min(metrics.minDuration, obj.data.value);
        metrics.maxDuration = Math.max(metrics.maxDuration, obj.data.value);
      }
      
      if (obj.type === 'Point' && obj.metric === 'checks') {
        const checkName = obj.data.tags.check;
        metrics.checks[checkName] = metrics.checks[checkName] || { passed: 0, failed: 0 };
        obj.data.value === 1 ? metrics.checks[checkName].passed++ : metrics.checks[checkName].failed++;
      }
    } catch (e) {
      // Ignorar linhas que não são JSON válido
    }
  });

  metrics.avgDuration = metrics.totalRequests > 0 ? (metrics.avgDuration / metrics.totalRequests).toFixed(2) : 0;
  metrics.durations.sort((a, b) => a - b);
  metrics.p95Duration = metrics.durations[Math.floor(metrics.durations.length * 0.95)];
  metrics.successRequests = metrics.totalRequests - metrics.failedRequests;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Teste de Performance - K6</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .metric-card {
            background: #f8f9fa;
            border-left: 5px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .metric-card h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .metric-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
        
        .metric-card .unit {
            font-size: 0.8em;
            color: #999;
            margin-left: 5px;
        }
        
        .section {
            margin-top: 40px;
        }
        
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .checks-list {
            list-style: none;
        }
        
        .checks-list li {
            padding: 12px;
            background: #f8f9fa;
            margin-bottom: 10px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .check-name {
            color: #333;
            font-weight: 500;
        }
        
        .check-status {
            display: flex;
            gap: 15px;
        }
        
        .badge {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        
        .badge-pass {
            background: #d4edda;
            color: #155724;
        }
        
        .badge-fail {
            background: #f8d7da;
            color: #721c24;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
            margin-top: 40px;
        }
        
        .threshold-status {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .threshold-pass {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .threshold-fail {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Performance K6</h1>
            <p>Teste de Carga - Agenda de Contatos API</p>
        </div>
        
        <div class="content">
            <div class="threshold-status ${metrics.p95Duration < 2000 ? 'threshold-pass' : 'threshold-fail'}">
                <strong>Status do Threshold:</strong> ${metrics.p95Duration < 2000 ? '✅ PASSOU' : '❌ FALHOU'}
                <br/>p(95) = ${metrics.p95Duration.toFixed(2)}ms ${metrics.p95Duration < 2000 ? '< 2000ms' : '> 2000ms'}
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total de Requisições</h3>
                    <span class="value">${metrics.totalRequests}</span>
                </div>
                
                <div class="metric-card">
                    <h3>Requisições com Sucesso</h3>
                    <span class="value" style="color: #28a745">${metrics.successRequests}</span>
                </div>
                
                <div class="metric-card">
                    <h3>Tempo Médio (ms)</h3>
                    <span class="value">${metrics.avgDuration}</span>
                </div>
                
                <div class="metric-card">
                    <h3>Tempo Mínimo (ms)</h3>
                    <span class="value">${metrics.minDuration === Infinity ? 0 : metrics.minDuration.toFixed(2)}</span>
                </div>
                
                <div class="metric-card">
                    <h3>Tempo Máximo (ms)</h3>
                    <span class="value">${metrics.maxDuration.toFixed(2)}</span>
                </div>
                
                <div class="metric-card">
                    <h3>Percentil 95 (ms)</h3>
                    <span class="value">${metrics.p95Duration ? metrics.p95Duration.toFixed(2) : 'N/A'}</span>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Resultados dos Checks</h2>
                <ul class="checks-list">
                    ${Object.entries(metrics.checks).map(([check, data]) => `
                        <li>
                            <span class="check-name">${check}</span>
                            <div class="check-status">
                                <span class="badge badge-pass">✓ ${data.passed}</span>
                                <span class="badge badge-fail">✗ ${data.failed}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="footer">
                <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
                <p style="font-size: 0.9em; margin-top: 10px;">
                    <strong>Observação:</strong> Este relatório é gerado pela biblioteca externa k6-reporter,
                    que transforma os dados coletados pelo k6 em um arquivo HTML visual e em JSON detalhado,
                    facilitando a análise de métricas de desempenho, latência e sucesso das requisições.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  const outputPath = path.join(__dirname, '../k6/report.html');
  fs.writeFileSync(outputPath, htmlContent);
  console.log(`✅ Relatório HTML gerado: ${outputPath}`);
}

generateHTMLReport();
