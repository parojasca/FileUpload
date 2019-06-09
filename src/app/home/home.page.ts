import { Component,ChangeDetectorRef,OnInit } from '@angular/core';

import { Camera,CameraOptions,PictureSourceType } from "@ionic-native/camera/ngx";
import { ActionSheetController,ToastController,Platform,LoadingController } from "@ionic/angular";
import { File, FileEntry } from "@ionic-native/file/ngx";
import { HttpClient } from "@angular/common/http";
import { WebView } from "@ionic-native/ionic-webview/ngx";
import { Storage } from "@ionic/storage";

import { finalize } from "rxjs/operators";
import { ChangeDetectionStrategy } from '@angular/compiler/src/compiler_facade_interface';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit{
 images=[];
  constructor(private camera: Camera,
    private file: File,
    private http: HttpClient,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private storage: Storage,
    private plt: Platform,
    private loadingController: LoadingController,
    private ref: ChangeDetectorRef
    
    ) {}
    ngOnInit(){
      this.plt.ready().then(()=>{
        this.loadStorageImages();
      })
    }
    loadStorageImages(){
      
    }

}
