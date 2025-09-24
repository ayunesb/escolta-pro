import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/storage';

type Form = {
  first_name?: string;
  last_name?: string;
  phone_e164?: string;
  photo_file?: FileList;
  id_front?: FileList;
  id_back?: FileList;
  hourly_rate_mxn_cents?: number;
  armed_available?: boolean;
  vehicle_available?: boolean;
};

export default function ProfileEditPage() {
  const { register, handleSubmit, setValue } = useForm<Form>();
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!error && data) {
        setValue('first_name', data.first_name ?? '');
        setValue('last_name', data.last_name ?? '');
        setValue('phone_e164', data.phone_e164 ?? '');
        if (data.photo_url) setAvatar(data.photo_url);
      }
      setLoading(false);
    })();
  }, [setValue]);

  const onSubmit = async (f: Form) => {
    setLoading(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return;

    if (f.photo_file && f.photo_file[0]) {
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      await supabase.storage.from('profiles').upload(path, f.photo_file[0], { upsert: true });
      try {
        const resp = await fetch('/functions/v1/signed_url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'profiles', path })
        });
        const { url } = await resp.json();
        setAvatar(url);
        await supabase.from('profiles').update({ photo_url: path }).eq('id', user.id);
      } catch (e) {
        console.warn('signed url fetch failed', e);
      }
    }

    async function uploadKyc(file?: File, label?: string): Promise<string | undefined> {
      if (!file || !label) return undefined;
      const path = `${user.id}/kyc-${label}-${Date.now()}.jpg`;
      await supabase.storage.from('kyc').upload(path, file, { upsert: true });
      return path;
    }

    const idFrontPath = await uploadKyc(f.id_front && f.id_front[0], 'front');
    const idBackPath = await uploadKyc(f.id_back && f.id_back[0], 'back');

    await supabase.from('profiles').upsert({
      id: user.id,
      role: 'freelancer',
      first_name: f.first_name,
      last_name: f.last_name,
      phone_e164: f.phone_e164,
      kyc_status: idFrontPath || idBackPath ? 'submitted' : undefined,
      hourly_rate_mxn_cents: f.hourly_rate_mxn_cents,
      armed_available: f.armed_available,
      vehicle_available: f.vehicle_available,
    });

    setLoading(false);
    alert('Perfil actualizado ✅');
  };

  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Perfil & KYC</h1>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(); }}>
        {avatar && <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover" />}
        <div>
          <label>Foto</label>
          <input type="file" accept="image/*" {...register('photo_file' as any)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Nombre</label>
            <input {...register('first_name' as any)} />
          </div>
          <div>
            <label>Apellido</label>
            <input {...register('last_name' as any)} />
          </div>
        </div>
        <div>
          <label>Teléfono (E.164)</label>
          <input placeholder="+521234567890" {...register('phone_e164' as any)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label>Tarifa por hora (MXN)</label>
            <input type="number" min={0} {...register('hourly_rate_mxn_cents' as any)} />
          </div>
          <div>
            <label>¿Disponible armado?</label>
            <input type="checkbox" {...register('armed_available' as any)} />
          </div>
          <div>
            <label>¿Disponible con vehículo?</label>
            <input type="checkbox" {...register('vehicle_available' as any)} />
          </div>
        </div>

        <div>
          <h2 className="font-medium">Identificación (KYC)</h2>
          <div>
            <label>INE/ID – Frente</label>
            <input type="file" accept="image/*,application/pdf" {...register('id_front' as any)} />
          </div>
          <div>
            <label>INE/ID – Reverso</label>
            <input type="file" accept="image/*,application/pdf" {...register('id_back' as any)} />
          </div>
          <p className="text-xs">Los archivos se guardan de forma privada. Blindado usa URLs firmadas por 1 hora.</p>
        </div>

        <button className="btn" type="submit">Guardar</button>
      </form>
    </div>
  );
}

