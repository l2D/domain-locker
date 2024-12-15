import { SupabaseClient, User } from '@supabase/supabase-js';
import { catchError, from, map, Observable, switchMap } from 'rxjs';
import { Tag } from '@/types/Database';

export class TagQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
    private getCurrentUser: () => Promise<User | null>,
  ) {}

  
  addTag(tag: Omit<Tag, 'id'>): Observable<Tag> {
    return from(this.supabase
      .from('tags')
      .insert(tag)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Failed to add tag');
        return data as Tag;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getTag(tagName: string): Observable<Tag> {
    return from(this.supabase
      .from('tags')
      .select('*')
      .eq('name', tagName)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Tag not found');
        return data as Tag;
      }),
      catchError(error => this.handleError(error))
    );
  }

  getTags(): Observable<Tag[]> {
    return from(this.supabase
      .from('tags')
      .select('*')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Tag[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  
  async saveTags(domainId: string, tags: string[]): Promise<void> {

    if (tags.length === 0) return;
  
    const userId = await this.getCurrentUser().then(user => user?.id);
    if (!userId) throw new Error('User must be authenticated to save tags.');
  
    for (const tag of tags) {
      // Try to insert the tag with the user_id
      const { data: savedTag, error: tagError } = await this.supabase
        .from('tags')
        .insert({ name: tag, user_id: userId })
        .select('id')
        .single();
  
      let tagId: string;
  
      if (savedTag) {
        tagId = savedTag.id;
      } else {
        // If the tag already exists, fetch its ID
        if (tagError?.code === '23505') { // Duplicate key violation
          const { data: existingTag, error: fetchError } = await this.supabase
            .from('tags')
            .select('id')
            .eq('name', tag)
            .eq('user_id', userId) // Ensure the existing tag belongs to the user
            .single();
          if (fetchError) throw fetchError;
          if (!existingTag) throw new Error(`Failed to fetch existing tag: ${tag}`);
          tagId = existingTag.id;
        } else {
          throw tagError;
        }
      }
  
      // Link the tag to the domain
      const { error: linkError } = await this.supabase
        .from('domain_tags')
        .insert({ domain_id: domainId, tag_id: tagId });
  
      if (linkError) throw linkError;
    }
  }

  
  getTagsWithDomainCounts(): Observable<any[]> {
    return from(
      this.supabase
        .from('tags')
        .select(`
          id,
          name,
          color,
          icon,
          description,
          domain_tags (
            domain_id
          )
        `)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(tag => ({
          ...tag,
          domain_count: tag.domain_tags.length,
        }));
      }),
      catchError(error => this.handleError(error))
    );
  }

  // Method to update tags
  async updateTags(domainId: string, tags: string[]): Promise<void> {
    // Delete existing domain tags
    await this.supabase.from('domain_tags').delete().eq('domain_id', domainId);
  
    // Insert or update tags
    for (const tagName of tags) {
      const { data: tag, error: tagError } = await this.supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();
  
      let tagId: string;
      if (tag) {
        tagId = tag.id;
      } else {
        const { data: newTag, error: newTagError } = await this.supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
  
        if (newTagError) {
          this.handleError(newTagError);
          return;
        };
        tagId = newTag.id;
      }
      await this.supabase
        .from('domain_tags')
        .insert({ domain_id: domainId, tag_id: tagId });
    }
  }


}
