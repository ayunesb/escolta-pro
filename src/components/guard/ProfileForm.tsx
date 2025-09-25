import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { uploadWithSignedUrl } from '../../lib/storage';

type FormData = {
  first_name: string;
  last_name: string;
  phone: string;
  hourly_rate: number;
  armed: boolean;
  photo?: FileList;
  license?: FileList;
};

export const ProfileForm: FC<{ initial?: Partial<FormData>; onSubmit: (d: FormData) => Promise<void> }> = ({ initial = {}, onSubmit }) => {
  const init: Partial<FormData> = initial;
  // We deliberately narrow the partial initial values to the expected shape without using 'any'.
  const safeDefaults: Partial<FormData> = {
    first_name: init.first_name ?? '',
    last_name: init.last_name ?? '',
    phone: init.phone ?? '',
    hourly_rate: init.hourly_rate ?? 0,
    armed: init.armed ?? false,
    // FileList fields intentionally omitted from defaults to avoid synthetic File objects.
  };
  const { register, handleSubmit } = useForm<FormData>({ defaultValues: safeDefaults as FormData });

  const submit = handleSubmit(async (data) => {
    try {
      if (data.photo && data.photo.length > 0) {
        await uploadWithSignedUrl(data.photo[0], `profiles/${Date.now()}_${data.photo[0].name}`);
      }
      if (data.license && data.license.length > 0) {
        await uploadWithSignedUrl(data.license[0], `licenses/${Date.now()}_${data.license[0].name}`);
      }
      await onSubmit(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Profile form submission failed:', message, err);
      alert('Upload failed');
    }
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label>First name</label>
        <input {...register('first_name')} className="input" />
      </div>
      <div>
        <label>Last name</label>
        <input {...register('last_name')} className="input" />
      </div>
      <div>
        <label>Phone</label>
        <input {...register('phone')} className="input" />
      </div>
      <div>
        <label>Hourly rate (MXN)</label>
        <input type="number" {...register('hourly_rate', { valueAsNumber: true })} className="input" />
      </div>
      <div>
        <label>
          <input type="checkbox" {...register('armed')} /> Armed
        </label>
      </div>
      <div>
        <label>Photo</label>
        <input type="file" {...register('photo')} />
      </div>
      <div>
        <label>License / Docs</label>
        <input type="file" {...register('license')} />
      </div>
      <div>
        <button type="submit" className="btn">Save</button>
      </div>
    </form>
  );
};
