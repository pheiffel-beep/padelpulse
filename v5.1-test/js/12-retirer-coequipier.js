/* PadelPulse : Retirer un coéquipier depuis le menu */
// ===== RETIRER UN COÉQUIPIER DEPUIS LE MENU =====
const _prevHandlePartnerSelectChange = handlePartnerSelectChange;
handlePartnerSelectChange = function(val) {
    _prevHandlePartnerSelectChange(val);
    const btn = document.getElementById('btn-remove-partner');
    if (btn) btn.style.display = (val && val !== '__NEW__' && !editingMatchId) ? 'block' : 'none';
};

function removeSelectedPartner() {
    const sel = document.getElementById('match-partner');
    const name = sel ? sel.value : '';
    if (!name || name === '__NEW__') return;
    if (!isPlayerHidden(name)) padelLists.hiddenPlayers.push(name);
    saveLists();
    updatePartnerDropdownOptions();
    const btn = document.getElementById('btn-remove-partner');
    if (btn) btn.style.display = 'none';
}

const _prevResetForPartner = resetMatchModalForm;
resetMatchModalForm = function() {
    _prevResetForPartner();
    const btn = document.getElementById('btn-remove-partner');
    if (btn) btn.style.display = 'none';
};
