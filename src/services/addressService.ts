import { supabase } from '../lib/supabase';
import { Address } from '../types/database.types';

export async function fetchCustomerAddresses(): Promise<Address[]> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer addresses:', error);
      return [];
    }

    return (data || []) as Address[];
  } catch (err) {
    console.error('Unexpected error fetching addresses:', err);
    return [];
  }
}

export async function createAddress(
  address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Address> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User is not authenticated.');
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert({
      ...address,
      user_id: userData.user.id,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create address: ${error?.message}`);
  }

  return data as Address;
}

export async function deleteAddress(addressId: string): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId);

  if (error) {
    throw new Error(`Failed to delete address: ${error.message}`);
  }
}
