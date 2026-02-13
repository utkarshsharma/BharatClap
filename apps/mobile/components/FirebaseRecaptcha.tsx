import React, { useRef, useCallback } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface FirebaseRecaptchaProps {
  visible: boolean;
  onVerify: (token: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
  };
}

const FirebaseRecaptcha: React.FC<FirebaseRecaptchaProps> = ({
  visible,
  onVerify,
  onError,
  onClose,
  firebaseConfig,
}) => {
  const webViewRef = useRef<WebView>(null);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fff; }
        #recaptcha-container { transform: scale(1.1); }
        .loading { font-family: sans-serif; color: #666; }
      </style>
    </head>
    <body>
      <div id="recaptcha-container"></div>
      <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
      <script>
        firebase.initializeApp(${JSON.stringify(firebaseConfig)});

        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible',
          callback: function(token) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token }));
          },
          'expired-callback': function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'reCAPTCHA expired' }));
          }
        });

        window.recaptchaVerifier.render().then(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
          // Auto-solve invisible recaptcha
          window.recaptchaVerifier.verify();
        }).catch(function(error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: error.message }));
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'verify') {
          onVerify(data.token);
        } else if (data.type === 'error') {
          onError(data.message);
        }
      } catch {
        onError('Failed to parse reCAPTCHA response');
      }
    },
    [onVerify, onError]
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FF6B00" style={styles.loader} />
          <WebView
            ref={webViewRef}
            source={{ html }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: 320,
    height: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    zIndex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default FirebaseRecaptcha;
