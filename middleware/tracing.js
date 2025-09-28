'use strict';

const opentelemetry = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http'  ); // Utilisez l'exportateur HTTP
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http'  ); // Exportateur de métriques HTTP
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Pour le dépannage, définissez le niveau de journalisation sur DiagLogLevel.DEBUG
opentelemetry.diag.setLogger(new opentelemetry.DiagConsoleLogger(), opentelemetry.DiagLogLevel.INFO);

// Configurez l'exportateur de traces OTLP pour pointer vers l'adresse IP de votre VM et le port 8080
const traceExporter = new OTLPTraceExporter({
  url: "http://192.168.72.129:8080/v1/traces", // Remplacez par l'IP de votre VM ELK
  headers: {
    'Content-Type': 'application/json',
  },
}  );

// Configurez l'exportateur de métriques OTLP pour pointer vers l'adresse IP de votre VM et le port 8081
const metricExporter = new OTLPMetricExporter({
  url: "http://192.168.72.129:8081/v1/metrics", // <-- CORRIGÉ : Utilisez le port 8081 pour les métriques
  headers: {
    'Content-Type': 'application/json',
  },
}  );

// Configuration du lecteur de métriques avec export périodique
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 5000, // Export toutes les 5 secondes
});

// Configuration de la ressource avec les attributs du service
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'cbs-middleware',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'banking',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
});

// Initialisation du SDK OpenTelemetry
const sdk = new NodeSDK({
  resource: resource,
  traceExporter: traceExporter,
  metricReader: metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Désactiver certaines instrumentations si nécessaire
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

// Démarrage du SDK
sdk.start();

console.log('OpenTelemetry configuré avec succès pour exporter vers ELK Stack');

module.exports = sdk;
