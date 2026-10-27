let openCount = 0;

export function syncScrollLock() {
  openCount = document.querySelectorAll('dialog[open]').length;
  document.body.classList.toggle('has-dialog', openCount > 0);
  window.dispatchEvent(new CustomEvent('dialog:change', { detail: { open: openCount } }));
}

export function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  dialog.showModal();
  syncScrollLock();
}

export function closeDialog(dialog) {
  if (!dialog || !dialog.open) return;
  dialog.close();
}

/** Close a native dialog when its backdrop (the dialog element itself) is clicked. */
export function bindBackdropClose(dialog) {
  if (!dialog) return;
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', syncScrollLock);
}
