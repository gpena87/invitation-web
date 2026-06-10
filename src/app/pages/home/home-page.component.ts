import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserMusicComponent } from "../../components/user-music/user-music.component";
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserMusicComponent, UserFormComponent, HeaderComponent],
})
export default class HomePage {}
