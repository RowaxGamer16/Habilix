import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import './App.css';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonToolbar,
  IonButtons,
  IonButton,
  IonHeader,
  IonContent,
  IonFooter,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, school, people, helpCircle, logIn, personCircle } from 'ionicons/icons';
import Inicio from './pages/Inicio';
import Cursos from './pages/Cursos';
import Contactos from './pages/Contactos';
import Ayuda from './pages/Ayuda';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import MaterialesCurso from './components/MaterialesCurso';
import InicioUsuario from './pages/Inicio_Usuario';
import PrivateRoute from './pages/PrivateRoute';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
setupIonicReact();

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const materiales = {
    1: ['Introducción a React', 'Componentes y Props', 'Hooks'],
    2: ['Fundamentos de Python', 'Manejo de Archivos', 'OOP'],
    3: ['Principios UX', 'Wireframes', 'Prototipos'],
  };

  return (
    <IonApp>
      <IonReactRouter>
        <IonHeader>
          <IonToolbar>
            <IonGrid>
              <IonRow className="ion-align-items-center">
                <IonCol size="12" size-md="4" className="ion-text-start">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IonImg src="/Habilix.jpg" alt="Logo" style={{ width: '90px', height: 'auto', marginRight: '10px' }} />
                    <IonLabel>Habilix</IonLabel>
                  </div>
                </IonCol>
                <IonCol size="12" size-md="8" className="ion-text-end">
                  <IonButtons>
                    <IonButton routerLink={isLoggedIn ? "/Inicio_Usuario" : "/Inicio"}>
                      <IonIcon icon={home} slot="start" />
                      {isLoggedIn ? 'Inicio_Usuario' : 'Inicio'}
                    </IonButton>
                    <IonButton routerLink="/Cursos">
                      <IonIcon icon={school} slot="start" />
                      Cursos
                    </IonButton>
                    <IonButton routerLink="/Contactos">
                      <IonIcon icon={people} slot="start" />
                      Contactos
                    </IonButton>
                    <IonButton routerLink="/Ayuda">
                      <IonIcon icon={helpCircle} slot="start" />
                      Ayuda
                    </IonButton>
                    {!isLoggedIn ? (
                      <IonButton routerLink="/Login">
                        <IonIcon icon={logIn} slot="start" />
                        Login / Registro
                      </IonButton>
                    ) : (
                      <>
                        <IonButton routerLink="/Perfil">
                          <IonIcon icon={personCircle} slot="start" />
                          Perfil
                        </IonButton>
                        
                      </>
                    )}
                  </IonButtons>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <IonRouterOutlet>
            <Route exact path="/Inicio" render={() => (isLoggedIn ? <Redirect to="/Inicio_Usuario" /> : <Inicio />)} />
            <Route exact path="/Cursos" component={Cursos} />
            <Route exact path="/Contactos" component={Contactos} />
            <Route exact path="/Ayuda" component={Ayuda} />
            <Route exact path="/Login" component={Login} />
            <PrivateRoute exact path="/Perfil" component={Perfil} isLoggedIn={isLoggedIn} />
            <PrivateRoute exact path="/Inicio_Usuario" component={InicioUsuario} isLoggedIn={isLoggedIn} />
            <Route exact path="/">
              <Redirect to="/Inicio" />
            </Route>
          </IonRouterOutlet>
        </IonContent>

        <IonFooter>
          <IonToolbar>
            <IonGrid>
              <IonRow>
                <IonCol size="12" size-md="4" className="ion-text-start">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IonImg src="/Habilix.jpg" alt="Logo Habilix" style={{ width: '60px', height: 'auto', marginRight: '10px' }} />
                    <IonText>
                      <h4>Habilix</h4>
                    </IonText>
                  </div>
                </IonCol>
                <IonCol size="12" size-md="4" className="ion-text-center">
                  <IonText color="medium">&copy; 2025 Derechos reservados.</IonText>
                </IonCol>
                <IonCol size="12" size-md="4" className="ion-text-end">
                  <IonText>Redes Sociales:</IonText>
                  <IonButton href="https://facebook.com" fill="clear">
                    <IonImg src="/Facebook.png" alt="Facebook" style={{ width: '24px' }} />
                  </IonButton>
                  <IonButton href="https://instagram.com" fill="clear">
                    <IonImg src="/Instagram.jpeg" alt="Instagram" style={{ width: '24px' }} />
                  </IonButton>
                  <IonButton href="https://twitter.com" fill="clear">
                    <IonImg src="/Twitter.jpeg" alt="Twitter" style={{ width: '24px' }} />
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonToolbar>
        </IonFooter>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
