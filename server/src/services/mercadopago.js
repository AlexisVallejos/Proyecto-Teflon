import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = process.env.MP_ACCESS_TOKEN || '';
const client = new MercadoPagoConfig({ accessToken });

export async function createPreference({
  items,
  payer,
  externalReference,
  notificationUrl,
  backUrls,
  statementDescriptor,
}) {
  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN not set');
  }

  const preference = new Preference(client);
  const result = await preference.create({
    body: {
      items,
      payer,
      external_reference: externalReference,
      notification_url: notificationUrl,
      back_urls: backUrls,
      statement_descriptor: statementDescriptor,
      auto_return: 'approved',
    },
  });

  return result;
}
