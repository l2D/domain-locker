import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { aboutPages } from '@/app/pages/about/data/about-page-list';
import { injectContentFiles } from '@analogjs/content';
import { DocAttributes } from '@/app/components/about-things/doc-viewer.component';

@Component({
  standalone: true,
  selector: 'about-index-page',
  templateUrl: './about.page.html',
  imports: [CommonModule, PrimeNgModule],
})
export default class AboutPageComponent {
  sections = aboutPages;

//   <a [routerLink]="file.slug" class="text-primary font-semibold no-underline">
//   {{ file.attributes.title }}
// </a>



  readonly autoLinks: { [key: string]: any } = {
    legal: injectContentFiles<DocAttributes>((contentFile) =>
      contentFile.filename.includes('/legal')
    )
  };
  
  makeId(title: string): string {
    return title.toLowerCase().replace(/ /g, '-');
  }
}
