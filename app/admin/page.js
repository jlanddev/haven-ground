'use client';

import { useState, useEffect, useRef } from 'react';
import { supabaseCms as supabase } from '../../lib/supabase-cms';
import {
  getAdminProperties, saveProperty, deleteProperty, uploadPhoto, uploadDoc, blankProperty, updateSortOrder,
} from '../../lib/admin-properties';

const GREEN = '#2F4F33';
const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminPage() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', color: GREEN }}>Loading…</div>;
  }
  if (!session) return <Login />;
  return <Dashboard email={session.user?.email} />;
}

// ---- Login -----------------------------------------------------------------
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr(error.message);
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F5EFD9', fontFamily: 'Georgia, serif' }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: 32, borderRadius: 12, width: 360, boxShadow: '0 10px 40px rgba(0,0,0,.1)' }}>
        <h1 style={{ color: GREEN, fontSize: 24, margin: '0 0 4px' }}>Haven Ground</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px' }}>Listings backend</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
          style={inp} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
          style={{ ...inp, marginTop: 10 }} />
        {err && <p style={{ color: '#b91c1c', fontSize: 13, margin: '10px 0 0' }}>{err}</p>}
        <button type="submit" disabled={busy} style={{ ...btn, width: '100%', marginTop: 16 }}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

// ---- Dashboard (list + editor) ---------------------------------------------
function Dashboard({ email }) {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // row being edited, or null
  const [err, setErr] = useState('');

  const [reordering, setReordering] = useState(false);

  const load = async () => {
    try { setRows(await getAdminProperties()); }
    catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  // Keep the open editor in the URL hash so a refresh reopens it (instead of
  // dropping back to the list). Restore once, after the rows have loaded.
  const setHash = (h) => { try { window.history.replaceState(null, '', h ? `#${h}` : window.location.pathname + window.location.search); } catch {} };
  const openEditor = (r) => { setEditing(r); setHash(`edit=${encodeURIComponent(r.id)}`); };
  const openNew = () => { setEditing(blankProperty()); setHash('edit=new'); };
  const closeEditor = () => { setHash(''); setEditing(null); load(); };
  const didRestore = useRef(false);
  useEffect(() => {
    if (!rows || didRestore.current) return;
    didRestore.current = true;
    const m = (window.location.hash || '').match(/^#edit=(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (id === 'new') { setEditing(blankProperty()); return; }
    const r = rows.find((x) => String(x.id) === id);
    if (r) setEditing(r);
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  // Move a listing up/down. Optimistically reorders, renumbers sort_order to the
  // new positions, and persists only the rows that changed. Public pages list by
  // sort_order ascending, so this controls the order on the site.
  const move = async (index, dir) => {
    if (!rows || reordering) return;
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const orig = rows;
    const next = rows.slice();
    const t = next[index]; next[index] = next[j]; next[j] = t;
    const renum = next.map((r, i) => ({ ...r, sort_order: i }));
    setRows(renum);
    setReordering(true);
    try {
      const changed = renum.filter((r) => (orig.find((o) => o.id === r.id)?.sort_order) !== r.sort_order);
      await Promise.all(changed.map((r) => updateSortOrder(r.id, r.sort_order)));
    } catch (e) { setErr(e.message); load(); }
    finally { setReordering(false); }
  };

  // Drag-and-drop reorder: drag a row to any position (not just one step).
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const handleDrop = async (to) => {
    const from = dragIndex;
    setDragIndex(null); setOverIndex(null);
    if (from == null || to == null || from === to || !rows) return;
    const orig = rows;
    const next = rows.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const renum = next.map((r, i) => ({ ...r, sort_order: i }));
    setRows(renum);
    try {
      const changed = renum.filter((r) => (orig.find((o) => o.id === r.id)?.sort_order) !== r.sort_order);
      await Promise.all(changed.map((r) => updateSortOrder(r.id, r.sort_order)));
    } catch (e) { setErr(e.message); load(); }
  };

  if (editing) {
    return <Editor row={editing} onClose={closeEditor} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFD9', fontFamily: 'Georgia, serif' }}>
      <div style={{ background: GREEN, color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20 }}>Haven Ground Listings</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
          <span style={{ opacity: 0.85 }}>{email}</span>
          <button onClick={() => supabase.auth.signOut()} style={{ ...btnGhost, borderColor: '#ffffff66', color: '#fff' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: GREEN, margin: 0 }}>All listings {rows ? `(${rows.length})` : ''}</h2>
          <button onClick={openNew} style={btn}>+ New Listing</button>
        </div>
        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}
        {!rows && <p>Loading…</p>}
        {rows && rows.length === 0 && <p style={{ color: '#6b7280' }}>No listings yet. Create your first one.</p>}
        <div style={{ display: 'grid', gap: 10 }}>
          {rows && rows.length > 1 && (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 2px 2px' }}>Drag a listing by the ⠿ handle to reorder, or use the arrows.</p>
          )}
          {rows && rows.map((r, i) => (
            <div
              key={r.id}
              onDragOver={(e) => { if (dragIndex != null) { e.preventDefault(); setOverIndex(i); } }}
              onDrop={(e) => { e.preventDefault(); handleDrop(i); }}
              style={{
                background: '#fff', borderRadius: 10, padding: '14px 18px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                opacity: dragIndex === i ? 0.4 : 1,
                borderTop: overIndex === i && dragIndex != null && dragIndex !== i ? `3px solid ${GREEN}` : '3px solid transparent',
                transition: 'opacity .12s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 12, flexShrink: 0 }}>
                <span
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                  title="Drag to reorder"
                  style={{ cursor: 'grab', color: '#b9bdb0', fontSize: 18, lineHeight: 1, userSelect: 'none', padding: '0 2px' }}
                >⠿</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <button onClick={() => move(i, -1)} disabled={i === 0 || reordering} title="Move up" style={arrowBtn(i === 0)}>▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1 || reordering} title="Move down" style={arrowBtn(i === rows.length - 1)}>▼</button>
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 17, color: '#1f2937', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.title || '(untitled)'}
                  {r.featured && <span style={tagStyle('#B8860B')}>Featured</span>}
                  {!r.published && <span style={tagStyle('#9ca3af')}>Draft</span>}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{r.data?.location || ''} · /{r.slug}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={tagStyle(r.status === 'Sold' ? '#9ca3af' : GREEN)}>{r.status}</span>
                <a href={`/properties/${r.slug}`} target="_blank" rel="noreferrer" style={btnGhost}>View</a>
                <button onClick={() => openEditor(r)} style={btn}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Editor ----------------------------------------------------------------
function Editor({ row, onClose }) {
  // Keep unsaved edits across a page refresh: persist the working copy to
  // localStorage keyed by this listing, restore it on mount, clear it on close.
  const draftKey = `hg-editor-draft-${row.id || 'new'}`;
  const [form, setForm] = useState(() => {
    try { const saved = localStorage.getItem(draftKey); if (saved) return JSON.parse(saved); } catch {}
    return JSON.parse(JSON.stringify(row));
  });
  const [tab, setTab] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { try { localStorage.setItem(draftKey, JSON.stringify(form)); } catch {} }, [draftKey, form]);
  const clearDraft = () => { try { localStorage.removeItem(draftKey); } catch {} };
  const close = () => { clearDraft(); onClose(); };

  const d = form.data || {};
  const setTop = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setD = (k, v) => setForm((f) => ({ ...f, data: { ...f.data, [k]: v } }));
  const setPD = (section, k, v) => setForm((f) => {
    const pd = f.data.propertyDetails || {};
    const sec = pd[section] || {};
    return { ...f, data: { ...f.data, propertyDetails: { ...pd, [section]: { ...sec, [k]: v } } } };
  });
  const setCoord = (k, v) => setForm((f) => {
    const pd = f.data.propertyDetails || {};
    const loc = pd.location || {};
    const coords = loc.coordinates || {};
    return { ...f, data: { ...f.data, propertyDetails: { ...pd, location: { ...loc, coordinates: { ...coords, [k]: v === '' ? null : parseFloat(v) } } } } };
  });

  // ---- AI draft (Phase A): fill fields from freeform notes --------------------
  const [aiNotes, setAiNotes] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');
  const [aiFilled, setAiFilled] = useState([]);
  const [platBusy, setPlatBusy] = useState(false);
  const [platErr, setPlatErr] = useState('');
  const [platMsg, setPlatMsg] = useState('');
  const [ppa, setPpa] = useState('');
  const [qtyTracts, setQtyTracts] = useState('');
  const [acresEach, setAcresEach] = useState('');

  // Build the next form + the list of filled fields synchronously, then set both.
  // (Doing this inside setForm's updater left the filled list empty on the line
  // that read it, so the "complete" message never showed.)
  const applyDraft = (x) => {
    const filled = [];
    const f = form;
    const next = { ...f, data: { ...(f.data || {}) } };
    const dd = next.data;
    const put = (k, v, label) => { if (v !== undefined && v !== null && v !== '') { dd[k] = v; filled.push(label || k); } };
    put('location', x.location);
    put('type', x.type);
    put('priceRange', x.priceRange, 'price range');
    put('acres', x.acres);
    put('lots', x.lots, 'acreage label');
    put('homeTypes', x.homeTypes, 'home types');
    put('targetBuyer', x.targetBuyer, 'target buyer');
    put('description', x.description);
    if (Array.isArray(x.features) && x.features.length) { dd.features = x.features; filled.push('features'); }
    if (Array.isArray(x.communityHighlights) && x.communityHighlights.length) { dd.communityHighlights = x.communityHighlights; filled.push('community highlights'); }
    if (x.price != null && x.price !== '') { dd.price = Number(x.price); filled.push('price'); }
    if (x.pricePerAcre != null && x.pricePerAcre !== '') { dd.pricePerAcre = Number(x.pricePerAcre); filled.push('price/acre'); }
    if (x.availableLots != null && x.availableLots !== '') { dd.availableLots = Number(x.availableLots); filled.push('available lots'); }
    if (x.title) { next.title = x.title; dd.title = x.title; if (!f.slug) next.slug = slugify(x.title); filled.push('title'); }
    if (x.status) { next.status = x.status; dd.status = x.status; filled.push('status'); }
    if (typeof x.featured === 'boolean') { next.featured = x.featured; dd.featured = x.featured; filled.push('featured'); }
    const clean = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    if (x.propertyDetails) {
      const pd = { ...(dd.propertyDetails || {}) };
      const loc = clean(x.propertyDetails.location);
      const feat = clean(x.propertyDetails.features);
      if (Object.keys(loc).length) { pd.location = { ...(pd.location || {}), ...loc }; filled.push('location details'); }
      if (Object.keys(feat).length) { pd.features = { ...(pd.features || {}), ...feat }; filled.push('utilities/topography'); }
      dd.propertyDetails = pd;
    }
    if (x.listingAgent) { const a = clean(x.listingAgent); if (Object.keys(a).length) { dd.listingAgent = { ...(dd.listingAgent || {}), ...a }; filled.push('agent'); } }
    if (x.lotUnit === 'Lots' || x.lotUnit === 'Tracts') dd.lotUnit = x.lotUnit;
    if (Array.isArray(x.lotTable) && x.lotTable.length) {
      const singular = (dd.lotUnit === 'Tracts') ? 'Tract' : 'Lot';
      dd.lotTable = x.lotTable.map((r, i) => {
        let lot = (r.lot == null ? '' : String(r.lot)).trim();
        if (!lot || /^\d+$/.test(lot)) lot = `${singular} ${i + 1}`;
        return {
          lot, size: r.size || '', price: r.price || '',
          status: ['Available', 'Pending', 'Sold'].includes(r.status) ? r.status : 'Available',
        };
      });
      filled.push(`${x.lotTable.length} ${(dd.lotUnit || 'Lots').toLowerCase()}`);
    }
    setForm(next);
    setAiFilled([...new Set(filled)]);
    return filled.length;
  };

  const draftWithAI = async () => {
    if (!aiNotes.trim()) { setAiErr('Add some notes first.'); return; }
    setAiBusy(true); setAiErr(''); setAiFilled([]);
    try {
      const res = await fetch('/api/ai/listing-draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: aiNotes, existing: { title: form.title, location: d.location, propertyDetails: d.propertyDetails } }),
      });
      const j = await res.json();
      if (!j.ok) { setAiErr(j.error || 'Draft failed.'); return; }
      applyDraft(j.draft || {});
    } catch (e) {
      setAiErr(e.message || 'Draft failed.');
    } finally {
      setAiBusy(false);
    }
  };

  const rid = () => Math.random().toString(36).slice(2, 9);
  const addDocEntry = (doc) => setForm((f) => ({ ...f, data: { ...(f.data || {}), documents: [...((f.data && f.data.documents) || []), doc] } }));
  const toggleDocShow = (id) => setD('documents', (d.documents || []).map((x) => (x.id === id ? { ...x, showOnSite: !x.showOnSite } : x)));
  const removeDoc = (id) => setD('documents', (d.documents || []).filter((x) => x.id !== id));

  // Read a plat's lots from its public URL into the table. Shared by the upload
  // flow and the per-document "Read lots" button.
  const readLotsFromUrl = async (fileUrl, name, prefixMsg = '') => {
    const res = await fetch('/api/ai/read-plat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl, mediaType: /\.pdf($|\?)/i.test(name || fileUrl) ? 'application/pdf' : '', filename: name }),
    });
    const txt = await res.text();
    let j = null;
    try { j = JSON.parse(txt); } catch { /* non-JSON = timeout/error page */ }
    if (!res.ok || !j || !j.ok) {
      const why = (j && j.error) ? j.error : 'the read timed out or the file was too complex';
      setPlatMsg(`${prefixMsg}Could not read lots (${why}). You can type the lots in by hand.`);
      return;
    }
    const lots = j.lots || [];
    if (!lots.length) { setPlatMsg(`${prefixMsg}No lots could be read, so the table was left as is.`); return; }
    const rate = parseFloat(ppa);
    const unitR = j.unit === 'Lots' ? 'Lots' : 'Tracts';
    const singular = unitR === 'Tracts' ? 'Tract' : 'Lot';
    const rows = lots.map((l, i) => {
      let lot = (l.lot == null ? '' : String(l.lot)).trim();
      if (!lot || /^\d+$/.test(lot)) lot = `${singular} ${i + 1}`;
      const acres = (typeof l.acres === 'number' && isFinite(l.acres)) ? l.acres : null;
      const size = acres != null ? `${acres} acres` : '';
      const price = (acres != null && rate > 0) ? `$${Math.round(acres * rate).toLocaleString()}` : '';
      return { lot, size, price, status: 'Available' };
    });
    setForm((f) => ({ ...f, data: { ...(f.data || {}), lotUnit: unitR, lotTable: rows } }));
    const priced = rows.filter((r) => r.price).length;
    setPlatMsg(`${prefixMsg}Read ${rows.length} ${unitR.toLowerCase()} from the plat${rate > 0 ? `, priced ${priced} at $${rate.toLocaleString()}/acre` : ' (set a price per acre and click Apply $/acre)'}. Check the table, then Save.`);
  };

  // Upload a plat/survey: store it as a document AND read its lots into the table.
  const readPlat = async (file) => {
    if (!file) return;
    setPlatBusy(true); setPlatErr(''); setPlatMsg('');
    try {
      const slug = form.slug || slugify(form.title) || 'listing';
      const up = await uploadDoc(file, slug);
      addDocEntry({ id: rid(), kind: 'survey', label: 'Plat / Survey', url: up.url, name: up.name, showOnSite: false });
      await readLotsFromUrl(up.url, up.name, `Saved ${up.name}. `);
    } catch (e) {
      setPlatErr('Upload or read failed: ' + (e.message || e));
    } finally {
      setPlatBusy(false);
    }
  };

  // Re-read lots from an already-uploaded document (no re-upload needed).
  const readDocLots = async (doc) => {
    setPlatBusy(true); setPlatErr(''); setPlatMsg('');
    try { await readLotsFromUrl(doc.url, doc.name, ''); }
    catch (e) { setPlatErr('Read failed: ' + (e.message || e)); }
    finally { setPlatBusy(false); }
  };

  // Upload a brochure (or any document) without reading it.
  const addBrochure = async (file) => {
    if (!file) return;
    setPlatBusy(true); setPlatErr(''); setPlatMsg('');
    try {
      const slug = form.slug || slugify(form.title) || 'listing';
      const up = await uploadDoc(file, slug);
      addDocEntry({ id: rid(), kind: 'brochure', label: 'Brochure', url: up.url, name: up.name, showOnSite: false });
      setPlatMsg(`Added brochure: ${up.name}. Check "Show on site" to put a download link on the listing.`);
    } catch (e) {
      setPlatErr('Upload failed: ' + (e.message || e));
    } finally {
      setPlatBusy(false);
    }
  };

  // Manual tract builder: type a count + acreage (+ price per acre) and fill the table.
  const money = (n) => `$${Math.round(n).toLocaleString()}`;
  const parseAcres = (sz) => { const m = String(sz || '').match(/[\d.]+/); return m ? parseFloat(m[0]) : null; };
  const buildTracts = () => {
    const n = parseInt(qtyTracts, 10);
    const ac = parseFloat(acresEach);
    const rate = parseFloat(ppa);
    setPlatErr(''); setPlatMsg('');
    if (!n || n < 1) { setPlatErr('Enter how many tracts (a number).'); return; }
    if (!ac || ac <= 0) { setPlatErr('Enter "Acres each" to fill sizes. Tracts are different sizes? Upload the plat and click "Read lots" to pull each acreage from the survey.'); return; }
    const singular = (d.lotUnit === 'Tracts') ? 'Tract' : 'Lot';
    const rows = Array.from({ length: n }, (_, i) => ({
      lot: `${singular} ${i + 1}`,
      size: ac ? `${ac} acres` : '',
      price: (ac && rate > 0) ? money(ac * rate) : '',
      status: 'Available',
    }));
    setD('lotTable', rows);
    setPlatMsg(`Built ${n} ${singular.toLowerCase()}${n > 1 ? 's' : ''}${ac ? ` of ${ac} acres` : ''}${(ac && rate > 0) ? ` at ${money(rate)}/acre` : ''}. Adjust any row, then Save.`);
  };
  const applyPricePerAcre = () => {
    const rate = parseFloat(ppa);
    const rows = d.lotTable || [];
    setPlatErr(''); setPlatMsg('');
    if (!(rate > 0)) { setPlatErr('Enter a price per acre first.'); return; }
    if (!rows.length) { setPlatErr('No tracts to price yet. Build or upload them first.'); return; }
    let priced = 0;
    const next = rows.map((r) => { const ac = parseAcres(r.size); if (ac) { priced += 1; return { ...r, price: money(ac * rate) }; } return r; });
    setD('lotTable', next);
    setPlatMsg(`Priced ${priced} of ${rows.length} row${rows.length > 1 ? 's' : ''} at ${money(rate)}/acre.`);
  };

  const save = async () => {
    setErr('');
    const slug = form.slug || slugify(form.title);
    if (!form.title || !slug) { setErr('Title is required.'); return; }
    setSaving(true);
    try {
      await saveProperty({ ...form, slug });
      close();
    } catch (e) {
      setErr(e.message || 'Could not save');
      setSaving(false);
    }
  };

  const onFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true); setErr('');
    try {
      const slug = form.slug || slugify(form.title) || 'listing';
      const urls = [];
      for (const file of Array.from(files)) urls.push(await uploadPhoto(file, slug));
      setD('images', [...(d.images || []), ...urls]);
    } catch (e) {
      setErr('Upload failed: ' + (e.message || e));
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (i, dir) => {
    const imgs = [...(d.images || [])];
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    setD('images', imgs);
  };
  const removeImage = (i) => setD('images', (d.images || []).filter((_, idx) => idx !== i));
  const makeCover = (i) => { const imgs = [...(d.images || [])]; const [c] = imgs.splice(i, 1); setD('images', [c, ...imgs]); };

  const unit = d.lotUnit || 'Lots';
  const tabs = [['basics', 'Basics'], ['description', 'Description'], ['location', 'Location'], ['photos', `Photos (${(d.images || []).length})`], ['agent', 'Agent'], ['lots', `${unit} (${(d.lotTable || []).length})`]];

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFD9', fontFamily: 'Georgia, serif' }}>
      <div style={{ background: GREEN, color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={close} style={{ ...btnGhost, borderColor: '#ffffff66', color: '#fff' }}>← Back</button>
        <div style={{ fontSize: 17 }}>{form.id ? 'Edit listing' : 'New listing'}</div>
        <button onClick={save} disabled={saving || uploading} style={{ ...btn, background: '#fff', color: GREEN }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}

        <details open style={{ ...card, marginBottom: 16, padding: 16 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: GREEN, fontSize: 15 }}>✨ Draft with AI</summary>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0' }}>
            Paste your notes or a listing blurb. AI fills the fields and writes the description for you to review. It only uses facts you give it, and nothing saves until you hit Save.
          </p>
          <textarea
            style={{ ...inp, minHeight: 110, width: '100%', boxSizing: 'border-box' }}
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            disabled={aiBusy}
            placeholder={'e.g. 11.15 acres on paved FM 3151, Houston County TX. Tract 3 of Gilbert Ranch, 5 tracts total. Mix of mature trees and open pasture. Outside FEMA flood zone, no county zoning. Coming soon. From the $160s.'}
          />
          <div style={{ marginTop: 10 }}>
            <button onClick={draftWithAI} disabled={aiBusy || !aiNotes.trim()} style={{ ...btn, opacity: (aiBusy || !aiNotes.trim()) ? 0.6 : 1, cursor: aiBusy ? 'wait' : 'pointer' }}>
              {aiBusy ? '⏳ Drafting…' : (aiFilled.length > 0 ? 'Redraft' : 'Draft with AI')}
            </button>
          </div>
          {aiBusy && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', fontSize: 14 }}>
              ⏳ Reading your notes and filling the fields. This usually takes a few seconds…
            </div>
          )}
          {!aiBusy && aiErr && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 14 }}>
              {aiErr}
            </div>
          )}
          {!aiBusy && !aiErr && aiFilled.length > 0 && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', fontSize: 14 }}>
              <strong>✓ Draft complete.</strong> Filled {aiFilled.length} {aiFilled.length === 1 ? 'field' : 'fields'}: {aiFilled.join(', ')}.<br />
              Open the tabs above to review, then hit <strong>Save</strong>. Nothing is saved yet.
            </div>
          )}

        </details>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...tabBtn, ...(tab === k ? { background: GREEN, color: '#fff', borderColor: GREEN, boxShadow: '0 1px 2px rgba(47,79,51,0.25)' } : {}) }}>{label}</button>
          ))}
        </div>

        <div style={card}>
          {tab === 'basics' && (
            <div style={grid2}>
              <Field label="Title" full><input style={inp} value={form.title || ''} onChange={(e) => { setTop('title', e.target.value); setD('title', e.target.value); }} /></Field>
              <Field label="URL slug" hint="auto from title if blank"><input style={inp} value={form.slug || ''} onChange={(e) => setTop('slug', slugify(e.target.value))} placeholder={slugify(form.title)} /></Field>
              <Field label="Location (City, ST)"><input style={inp} value={d.location || ''} onChange={(e) => setD('location', e.target.value)} placeholder="Shelbyville, TN" /></Field>
              <Field label="Status" hint="drives the badge at top of the listing">
                <select style={inp} value={form.status} onChange={(e) => { setTop('status', e.target.value); setD('status', e.target.value); }}>
                  <option value="Available">Available</option>
                  <option value="Sold Out">Sold Out</option>
                  <option value="coming-soon">Coming Soon</option>
                  <option value="Engineering & Planning">Engineering & Planning</option>
                </select>
              </Field>
              <Field label="Type">
                <select style={inp} value={d.type || 'single'} onChange={(e) => setD('type', e.target.value)}>
                  <option value="single">Single tract</option><option value="community">Community (multiple lots)</option>
                </select>
              </Field>
              <Field label="Price range (text)"><input style={inp} value={d.priceRange || ''} onChange={(e) => setD('priceRange', e.target.value)} placeholder="From the $140s" /></Field>
              <Field label="Price (number)"><input style={inp} type="number" value={d.price ?? ''} onChange={(e) => setD('price', e.target.value === '' ? null : Number(e.target.value))} /></Field>
              <Field label="Price per acre"><input style={inp} type="number" value={d.pricePerAcre ?? ''} onChange={(e) => setD('pricePerAcre', e.target.value === '' ? null : Number(e.target.value))} /></Field>
              <Field label="Acres (text)"><input style={inp} value={d.acres || ''} onChange={(e) => setD('acres', e.target.value)} placeholder="5-11" /></Field>
              <Field label="Acreage label"><input style={inp} value={d.lots || ''} onChange={(e) => setD('lots', e.target.value)} placeholder="5-11 Acres" /></Field>
              <Field label="Home types"><input style={inp} value={d.homeTypes || ''} onChange={(e) => setD('homeTypes', e.target.value)} placeholder="Ranch Style Homesites" /></Field>
              <Field label="Available lots (number)"><input style={inp} type="number" value={d.availableLots ?? ''} onChange={(e) => setD('availableLots', e.target.value === '' ? null : Number(e.target.value))} /></Field>
              <Field label="Target buyer"><input style={inp} value={d.targetBuyer || ''} onChange={(e) => setD('targetBuyer', e.target.value)} /></Field>
              <Field label="" full>
                <label style={chk}><input type="checkbox" checked={!!form.featured} onChange={(e) => { setTop('featured', e.target.checked); setD('featured', e.target.checked); }} /> Featured (shows the green “{(d.lotUnit === 'Tracts') ? 'Tracts' : 'Lots'} Available” badge)</label>
                <label style={chk}><input type="checkbox" checked={form.published !== false} onChange={(e) => setTop('published', e.target.checked)} /> Published (visible on site)</label>
              </Field>
            </div>
          )}

          {tab === 'description' && (
            <div>
              <Field label="Description" full><textarea style={{ ...inp, minHeight: 120 }} value={d.description || ''} onChange={(e) => setD('description', e.target.value)} /></Field>
              <ListEditor label="Features (tags)" items={d.features || []} onChange={(v) => setD('features', v)} placeholder="River Frontage" />
              <ListEditor label="Community highlights" items={d.communityHighlights || []} onChange={(v) => setD('communityHighlights', v)} placeholder="Soil Sites Approved on Each Lot" />
            </div>
          )}

          {tab === 'location' && (
            <div style={grid2}>
              <Field label="Address" full><input style={inp} value={d.propertyDetails?.location?.address || ''} onChange={(e) => setPD('location', 'address', e.target.value)} /></Field>
              <Field label="County"><input style={inp} value={d.propertyDetails?.location?.county || ''} onChange={(e) => setPD('location', 'county', e.target.value)} /></Field>
              <Field label="Parcel ID"><input style={inp} value={d.propertyDetails?.location?.parcelId || ''} onChange={(e) => setPD('location', 'parcelId', e.target.value)} /></Field>
              <Field label="Latitude"><input style={inp} type="number" step="any" value={d.propertyDetails?.location?.coordinates?.lat ?? ''} onChange={(e) => setCoord('lat', e.target.value)} /></Field>
              <Field label="Longitude"><input style={inp} type="number" step="any" value={d.propertyDetails?.location?.coordinates?.lng ?? ''} onChange={(e) => setCoord('lng', e.target.value)} /></Field>
              <Field label="Access"><input style={inp} value={d.propertyDetails?.features?.access || ''} onChange={(e) => setPD('features', 'access', e.target.value)} /></Field>
              <Field label="Power"><input style={inp} value={d.propertyDetails?.features?.power || ''} onChange={(e) => setPD('features', 'power', e.target.value)} /></Field>
              <Field label="Water"><input style={inp} value={d.propertyDetails?.features?.water || ''} onChange={(e) => setPD('features', 'water', e.target.value)} /></Field>
              <Field label="Sewer"><input style={inp} value={d.propertyDetails?.features?.sewer || ''} onChange={(e) => setPD('features', 'sewer', e.target.value)} /></Field>
              <Field label="Topography" full><textarea style={{ ...inp, minHeight: 70 }} value={d.propertyDetails?.features?.topography || ''} onChange={(e) => setPD('features', 'topography', e.target.value)} /></Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <ParcelMap
                  boundary={d.boundary}
                  center={d.propertyDetails?.location?.coordinates}
                  defaultQuery={d.propertyDetails?.location?.parcelId || d.propertyDetails?.location?.address || ''}
                  onSet={(boundary, center) => setForm((f) => {
                    const pd = f.data.propertyDetails || {};
                    const loc = pd.location || {};
                    return { ...f, data: { ...f.data, boundary, propertyDetails: { ...pd, location: { ...loc, coordinates: center } } } };
                  })}
                  onClear={() => setD('boundary', null)}
                />
              </div>
            </div>
          )}

          {tab === 'photos' && (
            <div>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>Photos are auto-compressed on upload (no giant files). The first photo is the cover.</p>
              <label style={{ ...btn, display: 'inline-block', cursor: 'pointer' }}>
                {uploading ? 'Uploading…' : '+ Upload Photos'}
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => onFiles(e.target.files)} disabled={uploading} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginTop: 16 }}>
                {(d.images || []).map((url, i) => (
                  <div key={url + i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ position: 'relative', paddingTop: '66%', background: '#f3f4f6' }}>
                      <img src={url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, background: GREEN, color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>Cover</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 6, fontSize: 12 }}>
                      <button onClick={() => moveImage(i, -1)} style={miniBtn} title="Move left">←</button>
                      <button onClick={() => makeCover(i)} style={miniBtn} title="Make cover">★</button>
                      <button onClick={() => moveImage(i, 1)} style={miniBtn} title="Move right">→</button>
                      <button onClick={() => removeImage(i)} style={{ ...miniBtn, color: '#b91c1c' }} title="Remove">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'agent' && (
            <div style={grid2}>
              <Field label="Agent name"><input style={inp} value={d.listingAgent?.name || ''} onChange={(e) => setD('listingAgent', { ...(d.listingAgent || {}), name: e.target.value })} /></Field>
              <Field label="Agent phone"><input style={inp} value={d.listingAgent?.phone || ''} onChange={(e) => setD('listingAgent', { ...(d.listingAgent || {}), phone: e.target.value })} /></Field>
              <Field label="Brokerage" full><input style={inp} value={d.listingAgent?.brokerage || ''} onChange={(e) => setD('listingAgent', { ...(d.listingAgent || {}), brokerage: e.target.value })} /></Field>
            </div>
          )}

          {tab === 'lots' && (
            <div>
              <LotsEditor lots={d.lotTable || []} unit={unit} onUnitChange={(u) => setD('lotUnit', u)} onChange={(v) => setD('lotTable', v)} />

              <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 20, paddingTop: 16 }}>
                <div style={{ fontWeight: 600, color: GREEN, fontSize: 15, marginBottom: 4 }}>Build / price {unit.toLowerCase()}</div>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px' }}>
                  Type how many, the acreage each, and a price per acre, then Fill. Or set just the price per acre and apply it to the rows above (or the ones a plat reads in).
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}># of {unit.toLowerCase()}</div>
                    <input type="number" value={qtyTracts} onChange={(e) => setQtyTracts(e.target.value)} placeholder="5" style={{ ...inp, width: 90 }} /></div>
                  <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Acres each</div>
                    <input type="number" value={acresEach} onChange={(e) => setAcresEach(e.target.value)} placeholder="5.23" style={{ ...inp, width: 110 }} /></div>
                  <div><div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Price per acre</div>
                    <input type="number" value={ppa} onChange={(e) => setPpa(e.target.value)} placeholder="29000" style={{ ...inp, width: 120 }} /></div>
                  <button onClick={buildTracts} style={btn}>Fill {unit.toLowerCase()}</button>
                  <button onClick={applyPricePerAcre} style={btnGhost}>Apply $/acre to rows</button>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 20, paddingTop: 16 }}>
                <div style={{ fontWeight: 600, color: GREEN, fontSize: 15, marginBottom: 4 }}>Documents</div>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 10px' }}>
                  Upload a plat/survey (reads the lots into the table above, and uses the price per acre you set) or a brochure. Check "Show on site" to add a download link on the property page.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{ ...btn, display: 'inline-block', cursor: platBusy ? 'wait' : 'pointer', opacity: platBusy ? 0.6 : 1 }}>
                    {platBusy ? '⏳ Working…' : '+ Plat / survey (reads lots)'}
                    <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={platBusy}
                      onChange={(e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) readPlat(fl); }} />
                  </label>
                  <label style={{ ...btnGhost, display: 'inline-block', cursor: platBusy ? 'wait' : 'pointer', opacity: platBusy ? 0.6 : 1 }}>
                    {platBusy ? '…' : '+ Brochure'}
                    <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={platBusy}
                      onChange={(e) => { const fl = e.target.files?.[0]; e.target.value = ''; if (fl) addBrochure(fl); }} />
                  </label>
                </div>
                {platBusy && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', fontSize: 14 }}>
                    ⏳ Uploading and reading the file. A plat can take 10 to 20 seconds…
                  </div>
                )}
                {!platBusy && platErr && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: 14 }}>{platErr}</div>
                )}
                {!platBusy && !platErr && platMsg && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#DCFCE7', border: '1px solid #86EFAC', color: '#166534', fontSize: 14 }}><strong>✓</strong> {platMsg}</div>
                )}

                <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                  {(d.documents || []).map((doc) => {
                    const isImg = /\.(jpe?g|png|webp|gif)$/i.test(doc.name || doc.url || '');
                    return (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', background: '#fff' }}>
                        {isImg
                          ? <img src={doc.url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flex: '0 0 auto' }} />
                          : <span style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', borderRadius: 6, fontSize: 20, flex: '0 0 auto' }}>📄</span>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.label || 'Document'}</div>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: GREEN, textDecoration: 'underline', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{doc.name || 'open'}</a>
                        </div>
                        {doc.kind === 'survey' && (
                          <button onClick={() => readDocLots(doc)} disabled={platBusy} style={{ ...btnGhost, padding: '5px 10px', fontSize: 12, flex: '0 0 auto', opacity: platBusy ? 0.6 : 1 }} title="Read the lots from this plat">
                            {platBusy ? '…' : 'Read lots'}
                          </button>
                        )}
                        <label style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
                          <input type="checkbox" checked={!!doc.showOnSite} onChange={() => toggleDocShow(doc.id)} /> Show on site
                        </label>
                        <button onClick={() => removeDoc(doc.id)} style={{ ...miniBtn, color: '#b91c1c', flex: '0 0 auto' }} title="Remove">✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Small building blocks -------------------------------------------------
function Field({ label, children, full, hint }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      {label !== '' && <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}{hint && <span style={{ color: '#9ca3af' }}> ({hint})</span>}</label>}
      {children}
    </div>
  );
}

function ListEditor({ label, items, onChange, placeholder }) {
  const set = (i, v) => onChange(items.map((it, idx) => (idx === i ? v : it)));
  return (
    <div style={{ marginTop: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <input style={{ ...inp, flex: 1 }} value={it} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} />
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} style={{ ...miniBtn, color: '#b91c1c' }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...items, ''])} style={{ ...btnGhost, marginTop: 8 }}>+ Add</button>
    </div>
  );
}

function LotsEditor({ lots, unit, onUnitChange, onChange }) {
  const set = (i, k, v) => onChange(lots.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const singular = unit === 'Tracts' ? 'Tract' : 'Lot';
  const addRow = () => onChange([...lots, { lot: `${singular} ${lots.length + 1}`, size: '', price: '', status: 'Available' }]);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>One row per {singular.toLowerCase()}. Use Tracts for larger ranchette parcels.</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Lots', 'Tracts'].map((u) => (
            <button key={u} onClick={() => onUnitChange(u)} style={{ ...tabBtn, ...(unit === u ? { background: GREEN, color: '#fff' } : {}) }}>{u}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 6, marginBottom: 4, fontSize: 11, color: '#9ca3af' }}>
        <span>{singular} name</span><span>Size</span><span>Price</span><span>Status</span><span />
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {lots.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
            <input style={inp} value={l.lot || ''} onChange={(e) => set(i, 'lot', e.target.value)} placeholder={`${singular} ${i + 1}`} />
            <input style={inp} value={l.size || ''} onChange={(e) => set(i, 'size', e.target.value)} placeholder="5.23 acres" />
            <input style={inp} value={l.price || ''} onChange={(e) => set(i, 'price', e.target.value)} placeholder="$151,670" />
            <select style={inp} value={l.status || 'Available'} onChange={(e) => set(i, 'status', e.target.value)}>
              <option>Available</option><option>Pending</option><option>Sold</option>
            </select>
            <button onClick={() => onChange(lots.filter((_, idx) => idx !== i))} style={{ ...miniBtn, color: '#b91c1c' }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={addRow} style={{ ...btnGhost, marginTop: 10 }}>+ Add {singular.toLowerCase()}</button>
    </div>
  );
}

// ---- Parcel map (Regrid lookup + boundary preview) -------------------------
let leafletLoading = null;
function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise((resolve) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => resolve(window.L);
    document.body.appendChild(s);
  });
  return leafletLoading;
}

// GeoJSON (lng,lat) -> boundary the public page expects ([lat,lng], or an array
// of rings for a multipolygon).
function geomToBoundary(geom) {
  if (!geom) return null;
  if (geom.type === 'Polygon') return geom.coordinates[0].map(([lng, lat]) => [lat, lng]);
  if (geom.type === 'MultiPolygon') return geom.coordinates.map((poly) => poly[0].map(([lng, lat]) => [lat, lng]));
  return null;
}
function boundaryCenter(boundary) {
  if (!boundary || !boundary.length) return null;
  const ring = Array.isArray(boundary[0][0]) ? boundary[0] : boundary;
  let la = 0, ln = 0;
  ring.forEach(([lat, lng]) => { la += lat; ln += lng; });
  return { lat: la / ring.length, lng: ln / ring.length };
}

function ParcelMap({ boundary, center, defaultQuery, onSet, onClear }) {
  const [query, setQuery] = useState(defaultQuery || '');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);
  const mapRef = useState(() => ({ map: null, layer: null }))[0];

  useEffect(() => { loadLeaflet().then(() => setReady(true)); }, []);

  // Draw / redraw the boundary whenever it changes.
  useEffect(() => {
    if (!ready || typeof window === 'undefined' || !window.L) return;
    const L = window.L;
    const el = document.getElementById('admin-parcel-map');
    if (!el) return;
    if (!mapRef.map) {
      mapRef.map = L.map('admin-parcel-map', { scrollWheelZoom: false, attributionControl: false });
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20 }).addTo(mapRef.map);
    }
    const map = mapRef.map;
    if (mapRef.layer) { map.removeLayer(mapRef.layer); mapRef.layer = null; }
    const style = { color: '#00FFFF', weight: 3, fillColor: '#00FFFF', fillOpacity: 0.2 };
    if (boundary && boundary.length) {
      const isMulti = Array.isArray(boundary[0][0]);
      mapRef.layer = isMulti ? L.layerGroup(boundary.map((r) => L.polygon(r, style))).addTo(map) : L.polygon(boundary, style).addTo(map);
      const b = isMulti ? L.polygon(boundary.flat()).getBounds() : L.polygon(boundary).getBounds();
      map.fitBounds(b, { padding: [20, 20] });
    } else if (center?.lat) {
      map.setView([center.lat, center.lng], 15);
    } else {
      map.setView([39.5, -98.35], 4);
    }
    setTimeout(() => map.invalidateSize(), 100);
  }, [ready, boundary, center, mapRef]);

  const lookup = async () => {
    if (!query.trim()) return;
    setBusy(true); setErr(''); setResults(null);
    try {
      const res = await fetch(`/api/regrid/parcel?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lookup failed');
      setResults(data.results || []);
      if (!data.results?.length) setErr('No parcels found. Try the full address or the APN.');
    } catch (e) {
      setErr(e.message || 'Lookup failed');
    } finally {
      setBusy(false);
    }
  };

  const pick = (r) => {
    const bnd = geomToBoundary(r.geometry);
    if (!bnd) { setErr('That parcel has no boundary on file.'); return; }
    onSet(bnd, boundaryCenter(bnd));
    setResults(null);
  };

  // Upload a .kml and pull its polygon(s) into the boundary. Parsed in the
  // browser (no Regrid call, no cost). Handles one or many polygons.
  const onKml = async (file) => {
    setErr('');
    try {
      const text = await file.text();
      const xml = new DOMParser().parseFromString(text, 'application/xml');
      if (xml.getElementsByTagName('parsererror').length) throw new Error('That file is not valid KML.');
      const polys = Array.from(xml.getElementsByTagName('Polygon'));
      const rings = polys.map((poly) => {
        // First <coordinates> in a Polygon is the outer boundary ring.
        const c = poly.getElementsByTagName('coordinates')[0];
        if (!c) return null;
        const pts = c.textContent.trim().split(/\s+/)
          .map((t) => t.split(',').map(Number))
          .filter((p) => p.length >= 2 && !Number.isNaN(p[0]) && !Number.isNaN(p[1]))
          .map(([lng, lat]) => [lat, lng]); // KML is lng,lat -> we store lat,lng
        return pts.length >= 3 ? pts : null;
      }).filter(Boolean);
      if (!rings.length) { setErr('No polygon boundary found in that KML.'); return; }
      const bnd = rings.length > 1 ? rings : rings[0];
      onSet(bnd, boundaryCenter(bnd));
    } catch (e) {
      setErr(e.message || 'Could not read that KML file.');
    }
  };

  return (
    <div style={{ marginTop: 6 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Parcel map (boundary shown on the listing)</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input style={{ ...inp, flex: 1 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Address or APN, e.g. 17 SE Wyoming Ave, Deming NM  or  0656-04-70" onKeyDown={(e) => e.key === 'Enter' && lookup()} />
        <button onClick={lookup} disabled={busy} style={btn}>{busy ? 'Looking…' : 'Look up parcel'}</button>
        <label style={{ ...btnGhost, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Upload KML
          <input type="file" accept=".kml,application/vnd.google-earth.kml+xml,text/xml" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onKml(f); e.target.value = ''; }} />
        </label>
        {boundary && boundary.length ? <button onClick={onClear} style={{ ...btnGhost, color: '#b91c1c', borderColor: '#b91c1c' }}>Clear</button> : null}
      </div>
      {err && <p style={{ color: '#b91c1c', fontSize: 13, margin: '0 0 8px' }}>{err}</p>}
      {results && results.length > 0 && (
        <div style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => pick(r)} style={{ ...btnGhost, textAlign: 'left', display: 'block', width: '100%' }}>
              {r.label || r.apn || 'Parcel'} {r.acres ? `· ${Number(r.acres).toFixed(2)} ac` : ''} {r.geometry ? '' : '· (no boundary)'}
            </button>
          ))}
        </div>
      )}
      <div id="admin-parcel-map" style={{ height: 320, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#eef2f0' }} />
      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{boundary && boundary.length ? 'Boundary saved. It will draw on the listing map.' : 'Upload a KML (free) or look up the parcel to pull its boundary, or leave blank to show a location pin.'}</p>
    </div>
  );
}

// ---- inline styles ---------------------------------------------------------
const inp = { width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const btn = { background: GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' };
const btnGhost = { background: 'transparent', color: GREEN, border: `1px solid ${GREEN}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block', outline: 'none' };
const tabBtn = { background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' };
const card = { background: '#fff', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,.06)' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const chk = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', marginTop: 8 };
const miniBtn = { background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 };
const tagStyle = (color) => ({ background: color, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999 });
const arrowBtn = (disabled) => ({ background: disabled ? '#f1efe6' : '#fff', color: disabled ? '#cbd0c4' : GREEN, border: `1px solid ${disabled ? '#e5e2d6' : GREEN}`, borderRadius: 6, width: 26, height: 20, lineHeight: '1', fontSize: 10, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', padding: 0 });
