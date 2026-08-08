'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getAdminProperties, saveProperty, deleteProperty, uploadPhoto, blankProperty,
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

  const load = async () => {
    try { setRows(await getAdminProperties()); }
    catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, []);

  if (editing) {
    return <Editor row={editing} onClose={() => { setEditing(null); load(); }} />;
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
          <button onClick={() => setEditing(blankProperty())} style={btn}>+ New Listing</button>
        </div>
        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}
        {!rows && <p>Loading…</p>}
        {rows && rows.length === 0 && <p style={{ color: '#6b7280' }}>No listings yet. Create your first one.</p>}
        <div style={{ display: 'grid', gap: 10 }}>
          {rows && rows.map((r) => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <div style={{ minWidth: 0 }}>
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
                <button onClick={() => setEditing(r)} style={btn}>Edit</button>
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
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(row)));
  const [tab, setTab] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const save = async () => {
    setErr('');
    const slug = form.slug || slugify(form.title);
    if (!form.title || !slug) { setErr('Title is required.'); return; }
    setSaving(true);
    try {
      await saveProperty({ ...form, slug });
      onClose();
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

  const tabs = [['basics', 'Basics'], ['description', 'Description'], ['location', 'Location'], ['photos', `Photos (${(d.images || []).length})`], ['agent', 'Agent'], ['lots', `Lots (${(d.lotTable || []).length})`]];

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFD9', fontFamily: 'Georgia, serif' }}>
      <div style={{ background: GREEN, color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, borderColor: '#ffffff66', color: '#fff' }}>← Back</button>
        <div style={{ fontSize: 17 }}>{form.id ? 'Edit listing' : 'New listing'}</div>
        <button onClick={save} disabled={saving || uploading} style={{ ...btn, background: '#fff', color: GREEN }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
        {err && <p style={{ color: '#b91c1c' }}>{err}</p>}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...tabBtn, ...(tab === k ? { background: GREEN, color: '#fff' } : {}) }}>{label}</button>
          ))}
        </div>

        <div style={card}>
          {tab === 'basics' && (
            <div style={grid2}>
              <Field label="Title" full><input style={inp} value={form.title || ''} onChange={(e) => { setTop('title', e.target.value); setD('title', e.target.value); }} /></Field>
              <Field label="URL slug" hint="auto from title if blank"><input style={inp} value={form.slug || ''} onChange={(e) => setTop('slug', slugify(e.target.value))} placeholder={slugify(form.title)} /></Field>
              <Field label="Location (City, ST)"><input style={inp} value={d.location || ''} onChange={(e) => setD('location', e.target.value)} placeholder="Shelbyville, TN" /></Field>
              <Field label="Status">
                <select style={inp} value={form.status} onChange={(e) => { setTop('status', e.target.value); setD('status', e.target.value); }}>
                  <option>Available</option><option>Pending</option><option>Sold</option>
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
                <label style={chk}><input type="checkbox" checked={!!form.featured} onChange={(e) => { setTop('featured', e.target.checked); setD('featured', e.target.checked); }} /> Featured on the site</label>
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
            <LotsEditor lots={d.lotTable || []} onChange={(v) => setD('lotTable', v)} />
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

function LotsEditor({ lots, onChange }) {
  const set = (i, k, v) => onChange(lots.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  return (
    <div>
      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 0 }}>For communities: one row per lot or tract.</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {lots.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
            <input style={inp} value={l.lot || ''} onChange={(e) => set(i, 'lot', e.target.value)} placeholder="Lot 1" />
            <input style={inp} value={l.size || ''} onChange={(e) => set(i, 'size', e.target.value)} placeholder="5.23 acres" />
            <input style={inp} value={l.price || ''} onChange={(e) => set(i, 'price', e.target.value)} placeholder="$151,670" />
            <select style={inp} value={l.status || 'Available'} onChange={(e) => set(i, 'status', e.target.value)}>
              <option>Available</option><option>Pending</option><option>Sold</option>
            </select>
            <button onClick={() => onChange(lots.filter((_, idx) => idx !== i))} style={{ ...miniBtn, color: '#b91c1c' }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...lots, { lot: '', size: '', price: '', status: 'Available' }])} style={{ ...btnGhost, marginTop: 10 }}>+ Add lot</button>
    </div>
  );
}

// ---- inline styles ---------------------------------------------------------
const inp = { width: '100%', padding: '9px 11px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
const btn = { background: GREEN, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost = { background: 'transparent', color: GREEN, border: `1px solid ${GREEN}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' };
const tabBtn = { background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const card = { background: '#fff', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,.06)' };
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const chk = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151', marginTop: 8 };
const miniBtn = { background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 };
const tagStyle = (color) => ({ background: color, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 999 });
