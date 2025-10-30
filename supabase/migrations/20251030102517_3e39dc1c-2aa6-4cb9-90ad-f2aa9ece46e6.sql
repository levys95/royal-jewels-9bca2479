-- Create storage bucket for product images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Storage policies for product images
create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Admins can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

create policy "Admins can update product images"
on storage.objects for update
using (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

create policy "Admins can delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);