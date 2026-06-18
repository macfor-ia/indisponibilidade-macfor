#!/bin/bash
BASE="http://localhost:3000"
C="/tmp/adm.txt"; J="/tmp/joa.txt"; L="/tmp/lid.txt"; R="/tmp/lei.txt"; S="/tmp/soc.txt"
rm -f $C $J $L $R $S
PASS=0; FAIL=0

ok() { echo "  [OK]  $1: $2"; PASS=$((PASS+1)); }
bad() { echo "  [XX]  $1: $2"; echo "        $(echo $3 | cut -c1-180)"; FAIL=$((FAIL+1)); }
chk() {
  local id=$1 desc=$2 resp=$3 pat=$4
  echo "$resp" | grep -qiE "$pat" && ok "$id" "$desc" || bad "$id" "$desc" "$resp"
}

# ── SESSIONS ──────────────────────────────────────
curl -s -c $C -b $C -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gustavo.romao@macfor.com.br","password":"admin123"}' > /dev/null

# ── PRE-CLEAN: remove leftover test users and data from previous runs ──
for EMAIL in uc01x uc03x uc04x; do
  ID=$(curl -s -c $C -b $C $BASE/api/admin/users | grep -o "\"id\":[0-9]*,\"email\":\"${EMAIL}[^,]*" | grep -o '[0-9]*')
  if [ -n "$ID" ]; then curl -s -c $C -b $C -X DELETE $BASE/api/admin/users/$ID > /dev/null; fi
done
# Delete ALL unavailability from joao.silva (admin can delete any status now)
JOAO_PRE=$(curl -s -c $C -b $C $BASE/api/admin/users | grep -o '"id":[0-9]*,"email":"joao\.silva[^,]*' | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
if [ -n "$JOAO_PRE" ]; then
  ALL_IDS=$(curl -s -c $C -b $C $BASE/api/unavailability | \
    grep -o '"id":[0-9]*,"user_id":'${JOAO_PRE} | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
  for RID in $ALL_IDS; do curl -s -c $C -b $C -X DELETE $BASE/api/unavailability/$RID > /dev/null; done
fi
echo "[cleanup done]"

DIRETO=$(curl -s -c $C -b $C $BASE/api/admin/users | grep -o '"id":[0-9]*,"email":"direto\.criado[^,]*' | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
JOAO=$(curl -s -c $C -b $C $BASE/api/admin/users | grep -o '"id":[0-9]*,"email":"joao\.silva[^,]*' | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
LEITOR=$(curl -s -c $C -b $C $BASE/api/admin/users | grep -o '"id":[0-9]*,"email":"leitor\.qa[^,]*' | grep -o '"id":[0-9]*' | grep -o '[0-9]*')

echo "IDs  direto=$DIRETO  joao=$JOAO  leitor=$LEITOR"

curl -s -c $C -b $C -X POST $BASE/api/admin/users/$DIRETO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"Planejamento","is_lider":true}' > /dev/null
curl -s -c $C -b $C -X POST $BASE/api/admin/users/$JOAO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"Tecnologia","is_lider":false}' > /dev/null

curl -s -c $J -b $J -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"joao.silva@macfor.com.br","password":"senha123"}' > /dev/null
curl -s -c $L -b $L -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"direto.criado@macfor.com.br","password":"senha123"}' > /dev/null
curl -s -c $R -b $R -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"leitor.qa@macfor.com.br","password":"senha123"}' > /dev/null
curl -s -c $S -b $S -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"socio.qa@macfor.com.br","password":"senha123"}' > /dev/null

echo ""
echo "========================================"
echo " 20 USE-CASE VALIDATION"
echo "========================================"

# UC-01 New employee registers
echo ""
echo "UC-01  New employee registers"
RESP=$(curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"uc01x@macfor.com.br","password":"senha123","full_name":"UC01","department":"Tecnologia"}')
chk UC-01 "Registration creates pending account" "$RESP" "aprovacao"
ID01=$(curl -s -c $C -b $C $BASE/api/admin/pending | grep -o '"id":[0-9]*,"email":"uc01x[^,]*' | grep -o '[0-9]*' | head -1)

# UC-02 Admin approves
echo "UC-02  Admin approves registration"
curl -s -c $C -b $C -X POST $BASE/api/admin/approve/$ID01 > /dev/null
RESP=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"uc01x@macfor.com.br","password":"senha123"}')
chk UC-02 "Approved user can login" "$RESP" "success"

# UC-03 Admin rejects
echo "UC-03  Admin rejects registration"
curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"email":"uc03x@macfor.com.br","password":"senha123","full_name":"UC03","department":"Social"}' > /dev/null
ID03=$(curl -s -c $C -b $C $BASE/api/admin/pending | grep -o '"id":[0-9]*,"email":"uc03x[^,]*' | grep -o '[0-9]*' | head -1)
curl -s -c $C -b $C -X POST $BASE/api/admin/reject/$ID03 > /dev/null
RESP=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"uc03x@macfor.com.br","password":"senha123"}')
chk UC-03 "Rejected user cannot login" "$RESP" "rejeitado"

# UC-04 Direct create (no approval needed)
echo "UC-04  Admin master creates user directly"
PREV=$(curl -s -c $C -b $C $BASE/api/admin/users | grep -o '"id":[0-9]*,"email":"uc04x[^,]*' | grep -o '[0-9]*')
if [ -n "$PREV" ]; then curl -s -c $C -b $C -X DELETE $BASE/api/admin/users/$PREV > /dev/null; fi
RESP=$(curl -s -c $C -b $C -X POST $BASE/api/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{"email":"uc04x@macfor.com.br","full_name":"UC04","password":"senha123","department":"Conteudo","role":"colaborador"}')
chk UC-04a "Direct create succeeds" "$RESP" "aprovado"
RESP=$(curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"uc04x@macfor.com.br","password":"senha123"}')
chk UC-04b "Created user can login immediately" "$RESP" "success"

# UC-05 Create sector
echo "UC-05  Admin master creates sector"
RESP=$(curl -s -c $C -b $C -X POST $BASE/api/admin/setores \
  -H "Content-Type: application/json" -d '{"name":"Inovacao"}')
chk UC-05 "Sector created" "$RESP" "Inovacao"

# UC-06 Rename sector
echo "UC-06  Admin master renames sector"
SIDX=$(curl -s $BASE/api/setores | grep -o '"[^"]*"' | grep -n '"Inovacao"' | cut -d: -f1 | head -1)
SIDX=$((SIDX - 1))
RESP=$(curl -s -c $C -b $C -X PUT $BASE/api/admin/setores/$SIDX \
  -H "Content-Type: application/json" -d '{"name":"Inovacao e Produto"}')
chk UC-06 "Sector renamed" "$RESP" "Produto"
SIDX2=$(curl -s $BASE/api/setores | grep -o '"[^"]*"' | grep -n '"Inovacao e Produto"' | cut -d: -f1 | head -1)
SIDX2=$((SIDX2 - 1))
curl -s -c $C -b $C -X DELETE $BASE/api/admin/setores/$SIDX2 > /dev/null

# UC-07 Assign as lider
echo "UC-07  Assign user as sector lider"
RESP=$(curl -s -c $C -b $C $BASE/api/admin/users | grep "direto.criado")
chk UC-07 "User assigned as lider of Planejamento" "$RESP" "lider"

# UC-08 Demote lider
echo "UC-08  Demote lider back to colaborador"
RESP=$(curl -s -c $C -b $C -X POST $BASE/api/admin/users/$DIRETO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"Planejamento","is_lider":false}')
chk UC-08 "Lider demoted to colaborador" "$RESP" "success"
# Re-elevate for rest of tests
curl -s -c $C -b $C -X POST $BASE/api/admin/users/$DIRETO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"Planejamento","is_lider":true}' > /dev/null

# UC-09 Prolonged unavailability
echo "UC-09  Colaborador submits prolonged unavailability"
RESP=$(curl -s -c $J -b $J -X POST $BASE/api/unavailability \
  -H "Content-Type: application/json" \
  -d '{"unavailability_type":"prolongado","department":"Tecnologia","start_date":"2027-06-01","end_date":"2027-06-15","total_days":15}')
chk UC-09 "Prolonged request (15 days) accepted" "$RESP" "sucesso"
RTECNO=$(curl -s -c $C -b $C $BASE/api/unavailability/pending | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
echo "  request-tecnologia=$RTECNO"

# UC-10 Pontual + overlap detection
echo "UC-10  Pontual unavailability + overlap guard"
RESP=$(curl -s -c $J -b $J -X POST $BASE/api/unavailability \
  -H "Content-Type: application/json" \
  -d '{"unavailability_type":"pontual","department":"Tecnologia","start_date":"2027-08-01","end_date":"2027-08-01","total_days":1}')
chk UC-10a "Single-day request accepted" "$RESP" "sucesso"
RPONTUAL=$(curl -s -c $C -b $C $BASE/api/unavailability/pending | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
RESP=$(curl -s -c $J -b $J -X POST $BASE/api/unavailability \
  -H "Content-Type: application/json" \
  -d '{"unavailability_type":"pontual","department":"Tecnologia","start_date":"2027-06-10","end_date":"2027-06-10","total_days":1}')
chk UC-10b "[NEW] Overlap detection blocks duplicate period" "$RESP" "sobrepoe"

# UC-11 Lider approves same-sector
echo "UC-11  Lider approves request from own sector"
curl -s -c $C -b $C -X POST $BASE/api/admin/users/$JOAO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"Planejamento","is_lider":false}' > /dev/null
RESP=$(curl -s -c $J -b $J -X POST $BASE/api/unavailability \
  -H "Content-Type: application/json" \
  -d '{"unavailability_type":"pontual","department":"Planejamento","start_date":"2027-09-01","end_date":"2027-09-01","total_days":1}')
RPLAN=$(curl -s -c $L -b $L $BASE/api/unavailability/pending | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
echo "  request-planejamento=$RPLAN"
RESP=$(curl -s -c $L -b $L -X POST $BASE/api/unavailability/$RPLAN/approve)
chk UC-11 "Lider approves same-sector request" "$RESP" "success"
curl -s -c $C -b $C -X POST $BASE/api/admin/users/$JOAO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"Tecnologia","is_lider":false}' > /dev/null

# UC-12 Lider blocked from different sector
echo "UC-12  Lider blocked from different sector"
RESP=$(curl -s -c $L -b $L -X POST $BASE/api/unavailability/$RTECNO/approve)
chk UC-12 "Lider (Planejamento) blocked from Tecnologia request" "$RESP" "permissao"

# UC-13 Cancel own pending
echo "UC-13  Colaborador cancels own pending request"
RESP=$(curl -s -c $J -b $J -X DELETE $BASE/api/unavailability/$RPONTUAL)
chk UC-13 "Colaborador cancels own pending request" "$RESP" "success"

# UC-14 Cannot cancel approved
echo "UC-14  Cannot cancel approved request"
RESP=$(curl -s -c $J -b $J -X DELETE $BASE/api/unavailability/$RPLAN)
chk UC-14 "Cannot cancel approved request" "$RESP" "pendentes"

# UC-15 Multiple email approvers
echo "UC-15  Member with multiple email approvers"
MBR=$(curl -s -c $C -b $C $BASE/api/members | grep -o '"id":[0-9]*,"name":"Mariana Batista dos Santos[^}]*' | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
RESP=$(curl -s -c $C -b $C -X PUT $BASE/api/admin/members/$MBR \
  -H "Content-Type: application/json" \
  -d '{"name":"Mariana Batista dos Santos","email":"mariana.batista@macfor.com.br","area":"Projetos/Operacoes","funcao":"PM Senior","report_to":"gustavo.romao@macfor.com.br, direto.criado@macfor.com.br","day_offs_quota":20,"operacoes":true}')
chk UC-15a "Member updated with two approvers" "$RESP" "success"
RESP=$(curl -s -c $C -b $C $BASE/api/members/by-email/mariana.batista%40macfor.com.br)
chk UC-15b "Email preserved (no nullification)" "$RESP" '"email":"mariana.batista'
chk UC-15c "Two approvers in report_to" "$RESP" "direto.criado"

# UC-16 Admin leitor read-only
echo "UC-16  Admin leitor is read-only"
RESP=$(curl -s -c $R -b $R $BASE/api/unavailability/pending)
chk UC-16a "Admin leitor sees ALL pending (fixed)" "$RESP" '"id"'
RESP=$(curl -s -c $R -b $R -X POST $BASE/api/unavailability/$RTECNO/approve)
chk UC-16b "Admin leitor cannot approve" "$RESP" "permissao"

# UC-17 Socio view-only
echo "UC-17  Socio view-only access"
RESP=$(curl -s -c $S -b $S $BASE/api/unavailability)
chk UC-17a "Socio sees all unavailability" "$RESP" '"id"'
RESP=$(curl -s -c $S -b $S -X POST $BASE/api/unavailability/$RTECNO/approve)
chk UC-17b "Socio cannot approve unavailability" "$RESP" "permissao"
RESP=$(curl -s -c $S -b $S -X POST $BASE/api/admin/approve/5)
chk UC-17c "Socio cannot manage user approvals" "$RESP" "Admin Editor"

# UC-18 Unauthenticated blocked
echo "UC-18  Unauthenticated access blocked"
chk UC-18a "Unauth /me blocked" "$(curl -s $BASE/api/auth/me)" "autenticado"
chk UC-18b "Unauth admin/users blocked" "$(curl -s $BASE/api/admin/users)" "autenticado"
chk UC-18c "Unauth POST unavailability blocked" "$(curl -s -X POST $BASE/api/unavailability -H 'Content-Type: application/json' -d '{}')" "autenticado"

# UC-19 Colaborador cannot admin
echo "UC-19  Colaborador blocked from admin endpoints"
chk UC-19a "Colaborador blocked from admin/users" "$(curl -s -c $J -b $J $BASE/api/admin/users)" "administradores"
chk UC-19b "Colaborador blocked from sector create" "$(curl -s -c $J -b $J -X POST $BASE/api/admin/setores -H 'Content-Type: application/json' -d '{"name":"Hack"}')" "Master"
chk UC-19c "Colaborador blocked from user delete" "$(curl -s -c $J -b $J -X DELETE $BASE/api/admin/users/1)" "Admin Editor|administradores"

# UC-20 Delete sector — graceful orphan
echo "UC-20  Sector deletion — users become orphaned in Sem Setor"
curl -s -c $C -b $C -X POST $BASE/api/admin/setores \
  -H "Content-Type: application/json" -d '{"name":"SectorUC20"}' > /dev/null
UC20=$(curl -s $BASE/api/setores | grep -o '"[^"]*"' | grep -n '"SectorUC20"' | cut -d: -f1 | head -1)
UC20=$((UC20 - 1))
curl -s -c $C -b $C -X POST $BASE/api/admin/users/$JOAO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"SectorUC20","is_lider":false}' > /dev/null
curl -s -c $C -b $C -X DELETE $BASE/api/admin/setores/$UC20 > /dev/null
RESP=$(curl -s $BASE/api/setores)
chk UC-20a "Deleted sector absent from list" "$(echo $RESP | grep -v SectorUC20 && echo _ok)" "_ok"
RESP=$(curl -s -c $C -b $C $BASE/api/admin/users | grep "joao.silva")
chk UC-20b "User still exists after sector deletion" "$RESP" "joao.silva"
chk UC-20c "User retains orphaned dept (shown in Sem Setor)" "$RESP" "SectorUC20"
curl -s -c $C -b $C -X POST $BASE/api/admin/users/$JOAO/assign-setor \
  -H "Content-Type: application/json" -d '{"setor":"Tecnologia","is_lider":false}' > /dev/null

echo ""
echo "=========================================="
echo " TOTAL: $PASS passed  |  $FAIL failed"
echo "=========================================="
