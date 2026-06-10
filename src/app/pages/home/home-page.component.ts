import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserFormComponent } from "../../components/user-form/user-form.component";
import { UserMusicComponent } from "../../components/user-music/user-music.component";

@Component({
  selector: 'app-home',
  imports: [UserFormComponent, UserMusicComponent],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {}
