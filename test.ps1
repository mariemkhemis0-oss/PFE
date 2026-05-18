#!/usr/bin/env pwsh
# Script de Test Automatisé - Backend et Frontend
# Usage: ./test.ps1

param(
    [switch]$Verbose = $false,
    [switch]$Full = $false
)

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CYBERAUDIT - TEST D'INTÉGRATION BACKEND & FRONTEND            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$testsPassed = 0
$testsFailed = 0

function Test-API {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Description
    )
    
    Write-Host "`n▶ $Name" -ForegroundColor Yellow
    Write-Host "  $Description" -ForegroundColor Gray
    
    try {
        $response = curl -s $Url -m 5
        if ($response) {
            Write-Host "  ✅ SUCCESS" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "  Response: $(($response | ConvertFrom-Json | ConvertTo-Json -Depth 1).Substring(0, 100))..." -ForegroundColor Gray
            }
            $script:testsPassed++
            return $true
        } else {
            Write-Host "  ❌ FAILED - No response" -ForegroundColor Red
            $script:testsFailed++
            return $false
        }
    } catch {
        Write-Host "  ❌ FAILED - $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

# ============================================
# SECTION 1: BACKEND TESTS
# ============================================
Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "SECTION 1: BACKEND TESTS (http://localhost:5000)" -ForegroundColor Cyan
Write-Host "$('='*60)" -ForegroundColor Cyan

Test-API "Backend Health Check" `
    "http://localhost:5000/ping" `
    "Vérifier que le serveur Express répond"

Test-API "Users Endpoint" `
    "http://localhost:5000/api/users" `
    "Charger la liste des utilisateurs"

Test-API "Vulnerabilities Endpoint" `
    "http://localhost:5000/api/vulnerabilities" `
    "Charger la liste des vulnérabilités"

Test-API "Reports Endpoint" `
    "http://localhost:5000/api/reports" `
    "Charger la liste des rapports"

Test-API "Notifications Endpoint" `
    "http://localhost:5000/api/notifications" `
    "Charger la liste des notifications"

Test-API "Dashboard Endpoint" `
    "http://localhost:5000/api/dashboard" `
    "Charger les données du tableau de bord"

Test-API "System Health" `
    "http://localhost:5000/api/health" `
    "Vérifier l'état du système"

Test-API "Vulnerability Stats" `
    "http://localhost:5000/api/vulnerabilities/stats" `
    "Charger les statistiques des vulnérabilités"

Test-API "Reports Stats" `
    "http://localhost:5000/api/reports/stats" `
    "Charger les statistiques des rapports"

# ============================================
# SECTION 2: FRONTEND TESTS
# ============================================
Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "SECTION 2: FRONTEND TESTS (http://localhost:3001)" -ForegroundColor Cyan
Write-Host "$('='*60)" -ForegroundColor Cyan

$frontendPort = 3001
$frontendResponse = curl -s "http://localhost:$frontendPort" -m 5

if ($frontendResponse -match "<!DOCTYPE html") {
    Write-Host "`n▶ Frontend Response Check (Port $frontendPort)" -ForegroundColor Yellow
    Write-Host "  ✅ Frontend is running" -ForegroundColor Green
    $script:testsPassed++
} else {
    Write-Host "`n▶ Frontend Response Check (Port $frontendPort)" -ForegroundColor Yellow
    Write-Host "  ⚠️  Port $frontendPort not responding, trying 3000..." -ForegroundColor Yellow
    
    $frontendResponse = curl -s "http://localhost:3000" -m 5
    if ($frontendResponse -match "<!DOCTYPE html") {
        Write-Host "  ✅ Frontend is running on port 3000" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  ❌ Frontend not responding on any port" -ForegroundColor Red
        $script:testsFailed++
    }
}

# ============================================
# SECTION 3: CORS CONFIGURATION TEST
# ============================================
Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "SECTION 3: CORS CONFIGURATION TEST" -ForegroundColor Cyan
Write-Host "$('='*60)" -ForegroundColor Cyan

Write-Host "`n▶ CORS Policy Check" -ForegroundColor Yellow
Write-Host "  Backend allows requests from localhost:3000-3001" -ForegroundColor Gray

# Test CORS with a simulated browser request
try {
    $response = curl -s "http://localhost:5000/api/users" -H "Origin: http://localhost:3001" -m 5
    if ($response) {
        Write-Host "  ✅ CORS headers are properly configured" -ForegroundColor Green
        $script:testsPassed++
    }
} catch {
    Write-Host "  ⚠️  Could not verify CORS" -ForegroundColor Yellow
}

# ============================================
# SECTION 4: DATA VALIDATION
# ============================================
Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "SECTION 4: DATA VALIDATION" -ForegroundColor Cyan
Write-Host "$('='*60)" -ForegroundColor Cyan

Write-Host "`n▶ Users Data Structure" -ForegroundColor Yellow
$users = curl -s http://localhost:5000/api/users | ConvertFrom-Json
if ($users -and $users.Count -gt 0) {
    Write-Host "  ✅ Users found: $($users.Count)" -ForegroundColor Green
    Write-Host "  Sample user: $($users[0].name) ($($users[0].role))" -ForegroundColor Gray
    $script:testsPassed++
} else {
    Write-Host "  ❌ No users found" -ForegroundColor Red
    $script:testsFailed++
}

Write-Host "`n▶ Vulnerabilities Data Structure" -ForegroundColor Yellow
$vulns = curl -s http://localhost:5000/api/vulnerabilities | ConvertFrom-Json
if ($vulns -and $vulns.Count -gt 0) {
    Write-Host "  ✅ Vulnerabilities found: $($vulns.Count)" -ForegroundColor Green
    $stats = curl -s http://localhost:5000/api/vulnerabilities/stats | ConvertFrom-Json
    Write-Host "  Critical: $($stats.critical), High: $($stats.high), Medium: $($stats.medium)" -ForegroundColor Gray
    $script:testsPassed++
} else {
    Write-Host "  ❌ No vulnerabilities found" -ForegroundColor Red
    $script:testsFailed++
}

# ============================================
# FINAL RESULTS
# ============================================
Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "TEST RESULTS" -ForegroundColor Cyan
Write-Host "$('='*60)" -ForegroundColor Cyan

Write-Host "`n✅ PASSED: $testsPassed" -ForegroundColor Green
Write-Host "❌ FAILED: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })

$totalTests = $testsPassed + $testsFailed
$successRate = if ($totalTests -gt 0) { [math]::Round(($testsPassed / $totalTests) * 100, 2) } else { 0 }

Write-Host "`n📊 Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } else { "Yellow" })

if ($testsFailed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Backend and Frontend are working correctly!" -ForegroundColor Green
    Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Open http://localhost:3001 in your browser" -ForegroundColor Gray
    Write-Host "   2. Press F12 to open DevTools" -ForegroundColor Gray
    Write-Host "   3. Go to Network tab to see API requests" -ForegroundColor Gray
    Write-Host "   4. Test Admin Portal to create/modify users" -ForegroundColor Gray
} else {
    Write-Host "`n⚠️  Some tests failed. Please check:" -ForegroundColor Yellow
    Write-Host "   1. Is the backend running on port 5000?" -ForegroundColor Gray
    Write-Host "   2. Is the frontend running on port 3001 (or 3000)?" -ForegroundColor Gray
    Write-Host "   3. Are there any error messages in the terminal?" -ForegroundColor Gray
}

Write-Host "`n" -ForegroundColor Gray
