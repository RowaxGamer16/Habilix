import React from 'react';
import ReactDOM from 'react-dom/client';
import { IonApp } from '@ionic/react';
import App from './App';

/* Estilos básicos de Ionic */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <IonApp>
    <App />
  </IonApp>
);
