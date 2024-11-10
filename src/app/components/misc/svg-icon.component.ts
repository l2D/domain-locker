import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';
import { NgStyle } from '@angular/common';

// SafeHtml pipe to bypass Angular's sanitization
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  
  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}

@Component({
  selector: 'dl-icon',
  standalone: true,
  imports: [NgStyle, SafeHtmlPipe], // Importing the pipe here
  template: `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      [class]="'h-full w-full' + classNames"
      [ngStyle]="mergedStyles" 
      [attr.viewBox]="viewBox"
      aria-hidden="true" 
      role="img"
      focusable="false">
      <g [innerHTML]="iconSvg | safeHtml"></g>
    </svg>
  `,
  styles: []
})
export class DlIconComponent implements OnChanges {

  @Input() icon: string = '';
  @Input() classNames: string = '';  // Additional classes for styling
  @Input() styles: any = {};         // Inline styles
  @Input() color: string = '';       // Fill color (defaults to currentColor if not set)
  @Input() viewBox: string = '0 0 512 512'; // Default viewBox

  mergedStyles: any = {};

  constructor(private sanitizer: DomSanitizer) {}

  // Merge default and input styles whenever inputs change
  ngOnChanges(changes: SimpleChanges): void {
    this.mergedStyles = {
      fill: this.color || 'currentColor', // Default to currentColor
      ...this.styles // Merge with other inline styles
    };
  }

  // Define our SVG <path> elements here (no <svg> tag needed)
  icons: { [key: string]: string } = {
    // Domain info page
    ssl: `<path d="M128 64c0-35.3 28.7-64 64-64L352 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64l-226.7 0c1.8-5.1 2.7-10.5 2.7-16l0-80c1.3-.5 2.5-1 3.8-1.5c6.8-3 14.3-7.8 20.6-15.5c6.4-7.9 10.1-17.2 11.4-27.1c.5-3.6 .8-5.7 1.1-7.1c1.1-.9 2.8-2.3 5.6-4.5c19.9-15.4 27.1-42.2 17.5-65.5c-1.4-3.3-2.1-5.4-2.6-6.7c.5-1.4 1.2-3.4 2.6-6.7c9.5-23.3 2.4-50.1-17.5-65.5c-2.8-2.2-4.5-3.6-5.6-4.5c-.3-1.4-.6-3.6-1.1-7.1c-3.4-24.9-23-44.6-47.9-47.9c-3.6-.5-5.7-.8-7.1-1.1c-.9-1.1-2.3-2.8-4.5-5.6c-15.4-19.9-42.2-27.1-65.5-17.5c-2.6 1.1-5.1 2.3-6.6 3l-.1 .1L128 64zm384 64l-128 0L384 0 512 128zM109.2 161.6L125 168c1.9 .8 4.1 .8 6.1 0l15.8-6.5c10-4.1 21.5-1 28.1 7.5l10.5 13.5c1.3 1.7 3.2 2.7 5.2 3l16.9 2.3c10.7 1.5 19.1 9.9 20.5 20.5l2.3 16.9c.3 2.1 1.4 4 3 5.2l13.5 10.5c8.5 6.6 11.6 18.1 7.5 28.1L248 285c-.8 1.9-.8 4.1 0 6.1l6.5 15.8c4.1 10 1 21.5-7.5 28.1l-13.5 10.5c-1.7 1.3-2.7 3.2-3 5.2l-2.3 16.9c-1.5 10.7-9.9 19.1-20.5 20.6L192 390.2 192 496c0 5.9-3.2 11.3-8.5 14.1s-11.5 2.5-16.4-.8L128 483.2 88.9 509.3c-4.9 3.3-11.2 3.6-16.4 .8s-8.5-8.2-8.5-14.1l0-105.8-15.5-2.1c-10.7-1.5-19.1-9.9-20.5-20.6l-2.3-16.9c-.3-2.1-1.4-4-3-5.2L9.1 334.9c-8.5-6.6-11.6-18.1-7.5-28.1L8 291c.8-1.9 .8-4.1 0-6.1L1.6 269.2c-4.1-10-1-21.5 7.5-28.1l13.5-10.5c1.7-1.3 2.7-3.2 3-5.2l2.3-16.9c1.5-10.7 9.9-19.1 20.5-20.5l16.9-2.3c2.1-.3 4-1.4 5.2-3l10.5-13.5c6.6-8.5 18.1-11.6 28.1-7.5z"/>`,
    registrar: `<path d="M0 128C0 92.7 28.7 64 64 64l512 0c35.3 0 64 28.7 64 64l0 48c0 8.8-7.3 15.8-15.8 18c-27.7 7-48.2 32.1-48.2 62s20.5 55 48.2 62c8.6 2.2 15.8 9.1 15.8 18l0 48c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128zm432 16a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm0 64a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm16 48a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm-16 80a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm16 48a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z"/>`,
    dates: `<path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z"/>`,
    tags: `<path d="M0 80L0 229.5c0 17 6.7 33.3 18.7 45.3l176 176c25 25 65.5 25 90.5 0L418.7 317.3c25-25 25-65.5 0-90.5l-176-176c-12-12-28.3-18.7-45.3-18.7L48 32C21.5 32 0 53.5 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>`,
    ips: `<path d="M352 256c0 22.2-1.2 43.6-3.3 64l-185.3 0c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64l185.3 0c2.2 20.4 3.3 41.8 3.3 64zm28.8-64l123.1 0c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64l-123.1 0c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32l-116.7 0c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0l-176.6 0c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0L18.6 160C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192l123.1 0c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64L8.1 320C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6l176.6 0c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352l116.7 0zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6l116.7 0z"/>`,
    whois: `<path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7c0-.8 0-1.5 0-2.3c-88.4 0-160-71.6-160-160c0-5.1 .2-10.1 .7-15c-6.2-.7-12.6-1-19-1l-91.4 0zM448 240.1a80 80 0 1 1 0 160 80 80 0 1 1 0-160zm0 208c26.7 0 51.4-8.2 71.9-22.1L599 505.1c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-79.1-79.1c14-20.5 22.1-45.3 22.1-71.9c0-70.7-57.3-128-128-128s-128 57.3-128 128s57.3 128 128 128z"/>`,
    host: `<path d="M64 32C28.7 32 0 60.7 0 96l0 64c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-64c0-35.3-28.7-64-64-64L64 32zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64l0 64c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-64c0-35.3-28.7-64-64-64L64 288zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/>`,
    dns: `<path d="M448 128A64 64 0 1 0 448 0a64 64 0 1 0 0 128zM128 32C57.3 32 0 89.3 0 160s57.3 128 128 128l256 0c35.3 0 64 28.7 64 64c0 27.9-17.9 51.7-42.8 60.4c-11.5-17.1-31-28.4-53.2-28.4c-35.3 0-64 28.7-64 64s28.7 64 64 64c24.7 0 46.1-14 56.8-34.4C467.6 466.1 512 414.2 512 352c0-70.7-57.3-128-128-128l-256 0c-35.3 0-64-28.7-64-64s28.7-64 64-64l128 0 0 14.1c0 9.9 8 17.9 17.9 17.9c4 0 7.8-1.3 11-3.8l60.8-47.3c4-3.1 6.3-7.9 6.3-12.9s-2.3-9.8-6.3-12.9L284.8 3.8c-3.1-2.4-7-3.8-11-3.8C264 0 256 8 256 17.9L256 32 128 32zm-8.6 384c-11.1-19.1-31.7-32-55.4-32c-35.3 0-64 28.7-64 64s28.7 64 64 64c23.7 0 44.4-12.9 55.4-32l40.6 0 0 14.1c0 9.9 8 17.9 17.9 17.9c4 0 7.8-1.3 11-3.8l60.8-47.3c4-3.1 6.3-7.9 6.3-12.9s-2.3-9.8-6.3-12.9l-60.8-47.3c-3.1-2.4-7-3.8-11-3.8c-9.9 0-17.9 8-17.9 17.9l0 14.1-40.6 0z"/>`,
    subdomains: `<path d="M256 64l128 0 0 64-128 0 0-64zM240 0c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48l48 0 0 32L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0 0 32-48 0c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48l160 0c26.5 0 48-21.5 48-48l0-96c0-26.5-21.5-48-48-48l-48 0 0-32 256 0 0 32-48 0c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48l160 0c26.5 0 48-21.5 48-48l0-96c0-26.5-21.5-48-48-48l-48 0 0-32 96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-256 0 0-32 48 0c26.5 0 48-21.5 48-48l0-96c0-26.5-21.5-48-48-48L240 0zM96 448l0-64 128 0 0 64L96 448zm320-64l128 0 0 64-128 0 0-64z"/>`,
    notes: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 224-112 0c-26.5 0-48 21.5-48 48l0 112L64 480c-35.3 0-64-28.7-64-64L0 96zM402.7 352l45.3 0-32 32-64 64-32 32 0-45.3 0-66.7c0-8.8 7.2-16 16-16l66.7 0zM112 376a24 24 0 1 0 -48 0 24 24 0 1 0 48 0zM88 112a24 24 0 1 0 0 48 24 24 0 1 0 0-48zm24 144a24 24 0 1 0 -48 0 24 24 0 1 0 48 0z"/></svg>`,
    notifications: '<path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416l384 0c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8l0-18.8c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/>',
    valuation: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M400 96l0 .7c-5.3-.4-10.6-.7-16-.7L256 96c-16.5 0-32.5 2.1-47.8 6c-.1-2-.2-4-.2-6c0-53 43-96 96-96s96 43 96 96zm-16 32c3.5 0 7 .1 10.4 .3c4.2 .3 8.4 .7 12.6 1.3C424.6 109.1 450.8 96 480 96l11.5 0c10.4 0 18 9.8 15.5 19.9l-13.8 55.2c15.8 14.8 28.7 32.8 37.5 52.9l13.3 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-32 0c-9.1 12.1-19.9 22.9-32 32l0 64c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-32-128 0 0 32c0 17.7-14.3 32-32 32l-32 0c-17.7 0-32-14.3-32-32l0-64c-34.9-26.2-58.7-66.3-63.2-112L68 304c-37.6 0-68-30.4-68-68s30.4-68 68-68l4 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-4 0c-11 0-20 9-20 20s9 20 20 20l31.2 0c12.1-59.8 57.7-107.5 116.3-122.8c12.9-3.4 26.5-5.2 40.5-5.2l128 0zm64 136a24 24 0 1 0 -48 0 24 24 0 1 0 48 0z"/></svg>',
    history: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9L0 168c0 13.3 10.7 24 24 24l110.1 0c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1c0-13.3-10.7-24-24-24z"/></svg>',
    status: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8l0 378.1C394 378 431.1 230.1 432 141.4L256 66.8s0 0 0 0z"/></svg>',
    
    // Notification channel icons
    email: '<path d="M256 64C150 64 64 150 64 256s86 192 192 192c17.7 0 32 14.3 32 32s-14.3 32-32 32C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256l0 32c0 53-43 96-96 96c-29.3 0-55.6-13.2-73.2-33.9C320 371.1 289.5 384 256 384c-70.7 0-128-57.3-128-128s57.3-128 128-128c27.9 0 53.7 8.9 74.7 24.1c5.7-5 13.1-8.1 21.3-8.1c17.7 0 32 14.3 32 32l0 80 0 32c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32c0-106-86-192-192-192zm64 192a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z"/>',
    pushNotification: '<path d="M320 0c-17.7 0-32 14.3-32 32l0 19.2C215 66 160 130.6 160 208l0 18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S115.4 416 128 416l384 0c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C497.3 319.2 480 273.9 480 226.8l0-18.8c0-77.4-55-142-128-156.8L352 32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7zM0 200c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-80 0c-13.3 0-24 10.7-24 24zm536-24c-13.3 0-24 10.7-24 24s10.7 24 24 24l80 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-80 0zM597.5 21.3c-5.9-11.9-20.3-16.7-32.2-10.7l-64 32c-11.9 5.9-16.7 20.3-10.7 32.2s20.3 16.7 32.2 10.7l64-32c11.9-5.9 16.7-20.3 10.7-32.2zM53.3 53.5l64 32c11.9 5.9 26.3 1.1 32.2-10.7s1.1-26.3-10.7-32.2l-64-32C62.9 4.6 48.5 9.4 42.5 21.3s-1.1 26.3 10.7 32.2z"/>',
    webHook: '<path d="M306 50.1c-43.1-9.9-86 16.9-95.9 60c-7.9 34.1 7.4 68.2 35.5 85.9c5.4 3.4 9.2 8.8 10.7 15s.3 12.7-3 18.1L170.4 361.5c3.6 6.7 5.6 14.4 5.6 22.5c0 26.5-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48c.6 0 1.1 0 1.7 0L201 221.9c-32.5-30.2-48.4-76.4-37.7-122.7C179.2 30.3 247.9-12.6 316.8 3.3c65.9 15.2 108 78.7 97.7 144.4c-2.1 13.1-14.3 22-27.4 20s-22-14.3-20-27.4c6.4-41.1-19.9-80.7-61.1-90.2zM289.7 176c-.6 0-1.1 0-1.7 0c-26.5 0-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48c0 8.1-2 15.8-5.6 22.5l71.3 114.1c45.8-17.7 99.8-8.2 136.8 28.9c50 50 50 131 0 181c-43 43-109 49-158.4 18c-11.2-7-14.6-21.8-7.6-33.1s21.8-14.6 33.1-7.6c30.9 19.3 72.1 15.5 99-11.3c31.2-31.2 31.2-81.9 0-113.1c-26.8-26.8-68.1-30.6-99-11.3c-5.4 3.4-11.9 4.5-18.1 3s-11.6-5.3-15-10.7L289.7 176zM448 432c-17.8 0-33.3-9.7-41.6-24l-152.7 0c-9.2 48.3-46 89-97 100.7c-68.9 15.9-137.6-27-153.5-95.9C-11 351 22.1 289.4 78.7 265.8c12.2-5.1 26.3 .7 31.4 12.9s-.7 26.3-12.9 31.4c-35.4 14.7-56 53.3-47.1 91.8c9.9 43 52.9 69.9 95.9 60c37-8.5 62.1-41.5 62-77.9c0-6.4 2.5-12.5 7-17s10.6-7 17-7l174.4 0c8.3-14.3 23.8-24 41.6-24c26.5 0 48 21.5 48 48s-21.5 48-48 48z"/>',
    signal: '<path d="M194.6 7.5l5.8 23.3C177.7 36.3 156 45.3 136 57.4L123.7 36.8c22-13.3 45.9-23.2 70.9-29.3zm122.9 0l-5.8 23.3C334.3 36.3 356 45.3 376 57.4l12.4-20.6c-22-13.3-46-23.2-71-29.3zM36.8 123.7c-13.3 22-23.2 45.9-29.3 70.9l23.3 5.8C36.3 177.7 45.3 156 57.4 136L36.8 123.7zM24 256c0-11.6 .9-23.3 2.6-34.8L2.9 217.6c-3.8 25.4-3.8 51.3 0 76.7l23.7-3.6C24.9 279.3 24 267.6 24 256zM388.3 475.2L376 454.6c-20 12.1-41.6 21-64.2 26.6l5.8 23.3c24.9-6.2 48.8-16 70.8-29.3zM488 256c0 11.6-.9 23.3-2.6 34.8l23.7 3.6c3.8-25.4 3.8-51.3 0-76.7l-23.7 3.6c1.7 11.5 2.6 23.1 2.6 34.8zm16.5 61.4l-23.3-5.8c-5.6 22.7-14.5 44.3-26.6 64.3l20.6 12.4c13.3-22 23.2-46 29.3-71zm-213.8 168c-23 3.5-46.5 3.5-69.5 0l-3.6 23.7c25.4 3.8 51.3 3.8 76.7 0l-3.6-23.7zm152-91.8c-13.8 18.7-30.4 35.3-49.2 49.1l14.2 19.3c20.7-15.2 39-33.4 54.2-54.1l-19.3-14.4zM393.6 69.2c18.8 13.8 35.3 30.4 49.2 49.2L462.1 104C446.9 83.4 428.6 65.1 408 49.9L393.6 69.2zM69.2 118.4c13.8-18.8 30.4-35.3 49.2-49.2L104 49.9C83.4 65.1 65.1 83.4 49.9 104l19.3 14.4zm406 5.3L454.6 136c12.1 20 21 41.6 26.6 64.2l23.3-5.8c-6.2-24.9-16-48.8-29.3-70.8zm-254-97.1c23-3.5 46.5-3.5 69.5 0l3.6-23.7C268.9-1 243.1-1 217.6 2.9l3.6 23.7zM81.6 468.4L32 480l11.6-49.6L20.2 425 8.6 474.5c-.9 4-.8 8.1 .3 12.1s3.2 7.5 6.1 10.4s6.5 5 10.4 6.1s8.1 1.2 12.1 .3L87 492l-5.4-23.6zM25.2 403.6L48.6 409l8-34.4c-11.7-19.6-20.4-40.8-25.8-63L7.5 317.4c5.2 21.2 13.2 41.7 23.6 60.8l-5.9 25.3zm112 52l-34.4 8 5.4 23.4 25.3-5.9c19.2 10.4 39.6 18.4 60.8 23.6l5.8-23.3c-22.1-5.5-43.3-14.3-62.8-26l-.2 .2zM256 48c-37.2 0-73.6 10-105.6 28.9s-58.4 46-76.3 78.6s-26.9 69.3-25.8 106.4s12 73.3 31.8 104.8L60 452l85.3-20c27.3 17.2 58.2 27.8 90.3 31s64.5-1.1 94.6-12.6s57.2-29.8 79-53.6s37.8-52.2 46.8-83.2s10.5-63.6 4.7-95.3s-19-61.6-38.4-87.4s-44.5-46.7-73.4-61S288.3 48 256 48z"/>',
    telegram: '<path d="M248 8C111 8 0 119 0 256S111 504 248 504 496 393 496 256 385 8 248 8zM363 176.7c-3.7 39.2-19.9 134.4-28.1 178.3-3.5 18.6-10.3 24.8-16.9 25.4-14.4 1.3-25.3-9.5-39.3-18.7-21.8-14.3-34.2-23.2-55.3-37.2-24.5-16.1-8.6-25 5.3-39.5 3.7-3.8 67.1-61.5 68.3-66.7 .2-.7 .3-3.1-1.2-4.4s-3.6-.8-5.1-.5q-3.3 .7-104.6 69.1-14.8 10.2-26.9 9.9c-8.9-.2-25.9-5-38.6-9.1-15.5-5-27.9-7.7-26.8-16.3q.8-6.7 18.5-13.7 108.4-47.2 144.6-62.3c68.9-28.6 83.2-33.6 92.5-33.8 2.1 0 6.6 .5 9.6 2.9a10.5 10.5 0 0 1 3.5 6.7A43.8 43.8 0 0 1 363 176.7z"/>',
    slack: '<path d="M94.1 315.1c0 25.9-21.2 47.1-47.1 47.1S0 341 0 315.1c0-25.9 21.2-47.1 47.1-47.1h47.1v47.1zm23.7 0c0-25.9 21.2-47.1 47.1-47.1s47.1 21.2 47.1 47.1v117.8c0 25.9-21.2 47.1-47.1 47.1s-47.1-21.2-47.1-47.1V315.1zm47.1-189c-25.9 0-47.1-21.2-47.1-47.1S139 32 164.9 32s47.1 21.2 47.1 47.1v47.1H164.9zm0 23.7c25.9 0 47.1 21.2 47.1 47.1s-21.2 47.1-47.1 47.1H47.1C21.2 244 0 222.8 0 196.9s21.2-47.1 47.1-47.1H164.9zm189 47.1c0-25.9 21.2-47.1 47.1-47.1 25.9 0 47.1 21.2 47.1 47.1s-21.2 47.1-47.1 47.1h-47.1V196.9zm-23.7 0c0 25.9-21.2 47.1-47.1 47.1-25.9 0-47.1-21.2-47.1-47.1V79.1c0-25.9 21.2-47.1 47.1-47.1 25.9 0 47.1 21.2 47.1 47.1V196.9zM283.1 385.9c25.9 0 47.1 21.2 47.1 47.1 0 25.9-21.2 47.1-47.1 47.1-25.9 0-47.1-21.2-47.1-47.1v-47.1h47.1zm0-23.7c-25.9 0-47.1-21.2-47.1-47.1 0-25.9 21.2-47.1 47.1-47.1h117.8c25.9 0 47.1 21.2 47.1 47.1 0 25.9-21.2 47.1-47.1 47.1H283.1z"/>',
    matrix: '<g transform="scale(21.333333)"><path d="M.632.55v22.9H2.28V24H0V0h2.28v.55zm7.043 7.26v1.157h.033c.309-.443.683-.784 1.117-1.024.433-.245.936-.365 1.5-.365.54 0 1.033.107 1.481.314.448.208.785.582 1.02 1.108.254-.374.6-.706 1.034-.992.434-.287.95-.43 1.546-.43.453 0 .872.056 1.26.167.388.11.716.286.993.53.276.245.489.559.646.951.152.392.23.863.23 1.417v5.728h-2.349V11.52c0-.286-.01-.559-.032-.812a1.755 1.755 0 0 0-.18-.66 1.106 1.106 0 0 0-.438-.448c-.194-.11-.457-.166-.785-.166-.332 0-.6.064-.803.189a1.38 1.38 0 0 0-.48.499 1.946 1.946 0 0 0-.231.696 5.56 5.56 0 0 0-.06.785v4.768h-2.35v-4.8c0-.254-.004-.503-.018-.752a2.074 2.074 0 0 0-.143-.688 1.052 1.052 0 0 0-.415-.503c-.194-.125-.476-.19-.854-.19-.111 0-.259.024-.439.074-.18.051-.36.143-.53.282-.171.138-.319.337-.439.595-.12.259-.18.6-.18 1.02v4.966H5.46V7.81zm15.693 15.64V.55H21.72V0H24v24h-2.28v-.55z"/></g>',
  };

  get iconSvg(): string {
    return this.icons[this.icon] || ''; // Return the selected icon's <path> content or an empty string if not found
  }
}
