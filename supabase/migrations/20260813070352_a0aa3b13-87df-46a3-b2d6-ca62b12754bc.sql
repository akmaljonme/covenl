
CREATE POLICY "covenl_read_files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('cvs','avatars','company-logos'));
CREATE POLICY "covenl_insert_own_files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('cvs','avatars','company-logos') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "covenl_update_own_files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('cvs','avatars','company-logos') AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id IN ('cvs','avatars','company-logos') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "covenl_delete_own_files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('cvs','avatars','company-logos') AND (storage.foldername(name))[1] = auth.uid()::text);
