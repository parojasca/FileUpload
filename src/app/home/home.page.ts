import { Component, ChangeDetectorRef, OnInit } from '@angular/core';

import { Camera, CameraOptions, PictureSourceType } from "@ionic-native/camera/ngx";
import { ActionSheetController, ToastController, Platform, LoadingController } from "@ionic/angular";
import { File, FileEntry } from "@ionic-native/file/ngx";
import { HttpClient } from "@angular/common/http";
import { WebView } from "@ionic-native/ionic-webview/ngx";
import { Storage } from "@ionic/storage";

import { finalize } from "rxjs/operators";
import { ChangeDetectionStrategy } from '@angular/compiler/src/compiler_facade_interface';
const STORAGE_KEY = 'my_images';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  images = [];
  constructor(private camera: Camera, private file: File,
    private http: HttpClient,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private storage: Storage,
    private plt: Platform,
    private loadingController: LoadingController,
    private ref: ChangeDetectorRef,
    private webview: WebView

  ) { }
  ngOnInit() {
    this.plt.ready().then(() => {
      this.loadStorageImages();
    })
  }
  loadStorageImages() {
    this.storage.get(STORAGE_KEY).then(images => {
      if (images) {
        let arr = JSON.parse(images);
        this.images = [];
        for (let img of arr) {
          let filePath = this.file.dataDirectory + img;
          let resPath = this.pahtForImage(filePath);
          this.images.push({ name: img, path: resPath, filePath: filePath });
        }
      }
    });
  }
  pahtForImage(img) {
    if (img === null) {
      return '';
    } else {
      let converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  async presentToast(text) {
    const toast = await this.toastController.create({
      message: text,
      position: 'bottom',
      duration: 3000
    });
    toast.present();
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: "Select Image sourse",
      buttons: [{
        text: 'Load from library',
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
        }
      },
      {
        text: 'useCamera',
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.CAMERA);
        }
      },
      {
        text: 'cancel',
        role: 'cancel'
      }
      ]
    });
    await actionSheet.present();
  }
  takePicture(sourceType: PictureSourceType) {
    var options: CameraOptions = {
      quality: 100,
      sourceType: sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true
    };
    this.camera.getPicture(options).then(imagePath => {
      var currentName = imagePath.substr(imagePath.lastIndexof('/') + 1);
      var correctPath = imagePath.substr(0, imagePath.lastIndexof('/') + 1);
      this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
    });
  }

  copyFileToLocalDir(namePath, currentName, newFilename) {
    this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFilename).then(_ => {
      this.updateStoredImages(newFilename);
    }, error => {
      this.presentToast('errr');
    });
  }

  createFileName() {
    var d = new Date(),
      n = d.getTime(),
      newFilename = n + ".jpg";
    return newFilename;
  }
  updateStoredImages(name) {
    this.storage.get(STORAGE_KEY).then(images => {
      let arr = JSON.parse(images);
      if (!arr) {
        let newImages = [name];
        this.storage.set(STORAGE_KEY, JSON.stringify(newImages));
      } else {
        arr.push(name),
          this.storage.set(STORAGE_KEY, JSON.stringify(arr));
      }
      let filePath = this.file.dataDirectory + name;
      let resPath = this.pahtForImage(filePath);

      let newEntry = {
        name: name,
        path: resPath,
        filePath: filePath
      };
      this.images = [newEntry, ...this.images];
      this.ref.detectChanges();
    });
  }

  deleteImages(imgEntry, position) {
    this.images.splice(position, 1);

    this.storage.get(STORAGE_KEY).then(images => {
      let arr = JSON.parse(images);
      let filtered = arr.filter(name => name != imgEntry.name);
      this.storage.set(STORAGE_KEY, JSON.stringify(filtered));

      var correctPath = imgEntry.filePath.substr(0, imgEntry.filePath.lastIndexof('/') + 1);

      this.file.removeFile(correctPath, imgEntry.name).then(res => {
        this.presentToast('file download')
      });
    });
  }

  startUpload(imgEntry) {
    this.file.resolveLocalFilesystemUrl(imgEntry.filePath)
      .then(entry => {
        (<FileEntry>entry).file(file => this.readFile(file))
      })
      .catch(err => {
        this.presentToast('error while reading file');
      })
  }

  readFile(file: any) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const formData = new FormData();
      const imgBlob = new Blob([reader.result], {
        type: file.type
      });
      formData.append('file', imgBlob, file.name);
      this.uploadImageData(formData);
    };
    reader.readAsArrayBuffer(file);
  }

  async uploadImageData(formData: FormData) {
    const loading = await this.loadingController.create({
      message: 'Uploading image.....',
    });
    await loading.present();

    this.http.post('http://localhost:81/uploads/upload.php', formData)
      .pipe(
        finalize(() => {
          loading.dismiss();
        })
      )
      .subscribe(res => {
        if (res['success']) {
          this.presentToast('File upload complete')
        } else {
          this.presentToast('file upload failed')
        }
      });
  }

}
