/**
 * Pincode Lookup Service
 *
 * Automatically fetches City (District), State, and Area/Localities
 * from India Post API when a user enters a valid 6-digit PIN code.
 */

export interface PincodeDetails {
  pincode: string;
  city: string;
  state: string;
  district: string;
  areas: string[];
}

const cache = new Map<string, PincodeDetails>();

export async function lookupPincode(rawPin: string): Promise<PincodeDetails | null> {
  const cleanPin = String(rawPin || '').replace(/[^0-9]/g, '');

  if (cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
    return null;
  }

  if (cache.has(cleanPin)) {
    return cache.get(cleanPin)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();

    if (
      Array.isArray(data) &&
      data[0]?.Status === 'Success' &&
      Array.isArray(data[0]?.PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const postOffices = data[0].PostOffice;
      const primary = postOffices[0];

      // Extract unique post office/locality names
      const areas: string[] = Array.from(
        new Set(
          postOffices
            .map((po: { Name?: string }) => (po.Name || '').trim())
            .filter((name: string) => name.length > 0)
        )
      );

      const details: PincodeDetails = {
        pincode: cleanPin,
        city: primary.District || primary.Block || primary.Circle || '',
        state: primary.State || '',
        district: primary.District || '',
        areas,
      };

      cache.set(cleanPin, details);
      return details;
    }

    return null;
  } catch (err) {
    console.warn('[PincodeService] Lookup failed for:', cleanPin, err);
    return null;
  }
}
