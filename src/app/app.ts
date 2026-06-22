import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html'
})
export class App implements AfterViewInit {
  @ViewChild('bgAudio', { static: false }) bgAudio!: ElementRef<HTMLAudioElement>;

  isMuted = signal(true);
  private audioInitialized = false;

  ngAfterViewInit(): void {
    this.setupAudioOnInteraction();
  }

  private setupAudioOnInteraction(): void {
    const startAudio = (event: Event) => {
      if ((event.target as HTMLElement).closest('[data-audio-toggle="true"]')) {
        return;
      }

      if (!this.audioInitialized) {
        const audio = this.bgAudio?.nativeElement;
        if (audio) {
          audio.volume = 0.3;
          audio.muted = false;

          audio.play().then(() => {
            this.audioInitialized = true;
            this.isMuted.set(false);

            document.removeEventListener('click', startAudio as EventListener);
            document.removeEventListener('touchstart', startAudio as EventListener);
            document.removeEventListener('keydown', startAudio as EventListener);
          }).catch((error) => {
            console.log('Audio play failed:', error);
          });
        }
      }
    };

    document.addEventListener('click', startAudio as EventListener);
    document.addEventListener('touchstart', startAudio as EventListener);
    document.addEventListener('keydown', startAudio as EventListener);
  }

  toggleAudio(): void {
    const audio = this.bgAudio?.nativeElement;
    if (audio) {
      audio.muted = !audio.muted;
      this.isMuted.set(audio.muted);
    }
  }
}
