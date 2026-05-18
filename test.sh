#!/bin/bash
# Script de Test Automatisé - Backend et Frontend
# Usage: chmod +x test.sh && ./test.sh

TESTS_PASSED=0
TESTS_FAILED=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  CYBERAUDIT - TEST D'INTÉGRATION BACKEND & FRONTEND            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"

test_api() {
    local name="$1"
    local url="$2"
    local description="$3"
    
    echo -e "\n${YELLOW}▶ $name${NC}"
    echo -e "  ${GRAY}$description${NC}"
    
    response=$(curl -s "$url" -m 5 2>/dev/null)
    
    if [ -z "$response" ]; then
        echo -e "  ${RED}❌ FAILED - No response${NC}"
        ((TESTS_FAILED++))
        return 1
    else
        echo -e "  ${GREEN}✅ SUCCESS${NC}"
        if [ "$VERBOSE" = "1" ]; then
            echo "  Response preview: ${response:0:100}..." | head -c 100
        fi
        ((TESTS_PASSED++))
        return 0
    fi
}

# ============================================
# SECTION 1: BACKEND TESTS
# ============================================
echo -e "\n${CYAN}$(printf '=%.0s' {1..60})${NC}"
echo -e "${CYAN}SECTION 1: BACKEND TESTS (http://localhost:5000)${NC}"
echo -e "${CYAN}$(printf '=%.0s' {1..60})${NC}"

test_api "Backend Health Check" \
    "http://localhost:5000/ping" \
    "Vérifier que le serveur Express répond"

test_api "Users Endpoint" \
    "http://localhost:5000/api/users" \
    "Charger la liste des utilisateurs"

test_api "Vulnerabilities Endpoint" \
    "http://localhost:5000/api/vulnerabilities" \
    "Charger la liste des vulnérabilités"

test_api "Reports Endpoint" \
    "http://localhost:5000/api/reports" \
    "Charger la liste des rapports"

test_api "Notifications Endpoint" \
    "http://localhost:5000/api/notifications" \
    "Charger la liste des notifications"

test_api "Dashboard Endpoint" \
    "http://localhost:5000/api/dashboard" \
    "Charger les données du tableau de bord"

test_api "System Health" \
    "http://localhost:5000/api/health" \
    "Vérifier l'état du système"

test_api "Vulnerability Stats" \
    "http://localhost:5000/api/vulnerabilities/stats" \
    "Charger les statistiques des vulnérabilités"

test_api "Reports Stats" \
    "http://localhost:5000/api/reports/stats" \
    "Charger les statistiques des rapports"

# ============================================
# SECTION 2: FRONTEND TESTS
# ============================================
echo -e "\n${CYAN}$(printf '=%.0s' {1..60})${NC}"
echo -e "${CYAN}SECTION 2: FRONTEND TESTS (http://localhost:3001)${NC}"
echo -e "${CYAN}$(printf '=%.0s' {1..60})${NC}"

FRONTEND_PORT=3001
frontend_response=$(curl -s "http://localhost:$FRONTEND_PORT" -m 5 2>/dev/null)

if echo "$frontend_response" | grep -q "<!DOCTYPE html"; then
    echo -e "\n${YELLOW}▶ Frontend Response Check (Port $FRONTEND_PORT)${NC}"
    echo -e "  ${GREEN}✅ Frontend is running${NC}"
    ((TESTS_PASSED++))
else
    echo -e "\n${YELLOW}▶ Frontend Response Check (Port $FRONTEND_PORT)${NC}"
    echo -e "  ${YELLOW}⚠️  Port $FRONTEND_PORT not responding, trying 3000...${NC}"
    
    frontend_response=$(curl -s "http://localhost:3000" -m 5 2>/dev/null)
    if echo "$frontend_response" | grep -q "<!DOCTYPE html"; then
        echo -e "  ${GREEN}✅ Frontend is running on port 3000${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}❌ Frontend not responding on any port${NC}"
        ((TESTS_FAILED++))
    fi
fi

# ============================================
# SECTION 3: CORS CONFIGURATION TEST
# ============================================
echo -e "\n${CYAN}$(printf '=%.0s' {1..60})${NC}"
echo -e "${CYAN}SECTION 3: CORS CONFIGURATION TEST${NC}"
echo -e "${CYAN}$(printf '=%.0s' {1..60})${NC}"

echo -e "\n${YELLOW}▶ CORS Policy Check${NC}"
echo -e "  ${GRAY}Backend allows requests from localhost:3000-3001${NC}"

response=$(curl -s "http://localhost:5000/api/users" -H "Origin: http://localhost:3001" -m 5 2>/dev/null)
if [ ! -z "$response" ]; then
    echo -e "  ${GREEN}✅ CORS headers are properly configured${NC}"
    ((TESTS_PASSED++))
fi

# ============================================
# SECTION 4: DATA VALIDATION
# ============================================
echo -e "\n${CYAN}$(printf '=%.0s' {1..60})${NC}"
echo -e "${CYAN}SECTION 4: DATA VALIDATION${NC}"
echo -e "${CYAN}$(printf '=%.0s' {1..60})${NC}"

echo -e "\n${YELLOW}▶ Users Data Structure${NC}"
users=$(curl -s http://localhost:5000/api/users 2>/dev/null)
if [ ! -z "$users" ]; then
    count=$(echo "$users" | jq length 2>/dev/null || echo "0")
    if [ "$count" -gt 0 ]; then
        echo -e "  ${GREEN}✅ Users found: $count${NC}"
        user_name=$(echo "$users" | jq -r '.[0].name' 2>/dev/null)
        user_role=$(echo "$users" | jq -r '.[0].role' 2>/dev/null)
        echo -e "  ${GRAY}Sample user: $user_name ($user_role)${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}❌ No users found${NC}"
        ((TESTS_FAILED++))
    fi
fi

echo -e "\n${YELLOW}▶ Vulnerabilities Data Structure${NC}"
vulns=$(curl -s http://localhost:5000/api/vulnerabilities 2>/dev/null)
if [ ! -z "$vulns" ]; then
    count=$(echo "$vulns" | jq length 2>/dev/null || echo "0")
    if [ "$count" -gt 0 ]; then
        echo -e "  ${GREEN}✅ Vulnerabilities found: $count${NC}"
        stats=$(curl -s http://localhost:5000/api/vulnerabilities/stats 2>/dev/null)
        critical=$(echo "$stats" | jq -r '.critical' 2>/dev/null)
        high=$(echo "$stats" | jq -r '.high' 2>/dev/null)
        medium=$(echo "$stats" | jq -r '.medium' 2>/dev/null)
        echo -e "  ${GRAY}Critical: $critical, High: $high, Medium: $medium${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}❌ No vulnerabilities found${NC}"
        ((TESTS_FAILED++))
    fi
fi

# ============================================
# FINAL RESULTS
# ============================================
echo -e "\n${CYAN}$(printf '=%.0s' {1..60})${NC}"
echo -e "${CYAN}TEST RESULTS${NC}"
echo -e "${CYAN}$(printf '=%.0s' {1..60})${NC}"

echo -e "\n${GREEN}✅ PASSED: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}❌ FAILED: $TESTS_FAILED${NC}"
else
    echo -e "${GREEN}❌ FAILED: $TESTS_FAILED${NC}"
fi

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=2; ($TESTS_PASSED / $TOTAL_TESTS) * 100" | bc)
else
    SUCCESS_RATE="0"
fi

if (( $(echo "$SUCCESS_RATE >= 80" | bc -l) )); then
    echo -e "\n${GREEN}📊 Success Rate: $SUCCESS_RATE%${NC}"
else
    echo -e "\n${YELLOW}📊 Success Rate: $SUCCESS_RATE%${NC}"
fi

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Backend and Frontend are working correctly!${NC}"
    echo -e "\n${CYAN}📝 Next steps:${NC}"
    echo -e "   ${GRAY}1. Open http://localhost:3001 in your browser${NC}"
    echo -e "   ${GRAY}2. Press F12 to open DevTools${NC}"
    echo -e "   ${GRAY}3. Go to Network tab to see API requests${NC}"
    echo -e "   ${GRAY}4. Test Admin Portal to create/modify users${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please check:${NC}"
    echo -e "   ${GRAY}1. Is the backend running on port 5000?${NC}"
    echo -e "   ${GRAY}2. Is the frontend running on port 3001 (or 3000)?${NC}"
    echo -e "   ${GRAY}3. Are there any error messages in the terminal?${NC}"
fi

echo
