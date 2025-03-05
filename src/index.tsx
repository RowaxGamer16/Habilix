import React from 'react';
import ReactDOM from 'react-dom';
import { IonApp } from '@ionic/react';
import App from './App';

/* Estilos básicos de Ionic */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

ReactDOM.render(
  <IonApp>
    <App />
  </IonApp>,
  document.getElementById('root')
);