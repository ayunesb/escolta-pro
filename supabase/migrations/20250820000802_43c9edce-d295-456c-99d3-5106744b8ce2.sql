
-- Allow authenticated users to upload and read their own objects in private buckets
-- Licenses bucket
create policy if not exists "uploader_insert_licenses_v1"
on storage.objects
for insert to authenticated
with check (bucket_id = 'licenses' and owner = auth.uid());

create policy if not exists "uploader_select_licenses_v1"
on storage.objects
for select to authenticated
using (bucket_id = 'licenses' and owner = auth.uid());

-- Vehicles bucket
create policy if not exists "uploader_insert_vehicles_v1"
on storage.objects
for insert to authenticated
with check (bucket_id = 'vehicles' and owner = auth.uid());

create policy if not exists "uploader_select_vehicles_v1"
on storage.objects
for select to authenticated
using (bucket_id = 'vehicles' and owner = auth.uid());

-- Incidents bucket
create policy if not exists "uploader_insert_incidents_v1"
on storage.objects
for insert to authenticated
with check (bucket_id = 'incidents' and owner = auth.uid());

create policy if not exists "uploader_select_incidents_v1"
on storage.objects
for select to authenticated
using (bucket_id = 'incidents' and owner = auth.uid());

-- Company admins: full access to all storage objects (fallback/admin operations)
create policy if not exists "company_admin_full_storage_v1"
on storage.objects
for all to authenticated
using (public.has_role(auth.uid(), 'company_admin'))
with check (public.has_role(auth.uid(), 'company_admin'));
