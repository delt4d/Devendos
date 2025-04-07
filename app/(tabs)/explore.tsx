import { StyleSheet, FlatList, View, TouchableOpacity, Modal } from 'react-native';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Contacts from 'expo-contacts';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

export default function TabTwoScreen() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contacts.Contact | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Note // We'll use the note field to store our date
          ],
        });

        if (data.length > 0) {
          setContacts(data);
        }
      }
    })();
  }, []);

  const openContactModal = (contact: Contacts.Contact) => {
    // Try to parse the date from the note field if it exists
    if (contact.note) {
      try {
        const parsedDate = new Date(contact.note);
        if (!isNaN(parsedDate.getTime())) {
          setCurrentDate(parsedDate);
        }
      } catch (e) {
        console.log("Couldn't parse date from note");
      }
    }
    setSelectedContact(contact);
    setIsModalVisible(true);
  };

  const closeContactModal = () => {
    setIsModalVisible(false);
    setSelectedContact(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Ensure the selected date is not before today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate >= today) {
        setCurrentDate(selectedDate);
      } else {
        // If they selected a date before today, default to today
        setCurrentDate(today);
      }
    }
  };

  const savePaymentDate = async () => {
    if (!selectedContact) return;

    try {
      const { status } = await Contacts.requestPermissionsAsync();

      if (status === 'granted') {
        await Contacts.updateContactAsync({
          ...selectedContact,
          note: currentDate.toISOString(),
        });
      }

      // Refresh the contacts list
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Note],
      });
      setContacts(data);

      closeContactModal();
    } catch (error) {
      console.error('Error saving payment date:', error);
    }
  };

  const renderContactItem = ({ item }: { item: Contacts.Contact }) => {
    // Parse the payment date from the note field if it exists
    let paymentDate = null;
    if (item.note) {
      try {
        const parsedDate = new Date(item.note);
        if (!isNaN(parsedDate.getTime())) {
          paymentDate = parsedDate;
        }
      } catch (e) {
        console.log("Couldn't parse date from note");
      }
    }

    return (
      <ThemedView style={styles.contactItem}>
        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
        {item.phoneNumbers?.map((phone, index) => (
          <ThemedText key={index} style={styles.phoneNumber}>
            {phone.number}
          </ThemedText>
        ))}
        {paymentDate && (
          <ThemedText style={styles.paymentDate}>
            Payment due: {format(paymentDate, 'MMM dd, yyyy')}
          </ThemedText>
        )}
        <TouchableOpacity onPress={() => openContactModal(item)}>
          <ThemedText type="link">{paymentDate ? 'Edit Payment Date' : 'Set Payment Date'}</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Contacts</ThemedText>
      </ThemedView>

      {contacts.length > 0 ? (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <ThemedText style={styles.noContactsText}>No contacts found</ThemedText>
      )}

      <Collapsible title="About this app">
        <ThemedText>This app demonstrates how to access contacts on your device.</ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/contacts/">
          <ThemedText type="link">Learn more about Expo Contacts</ThemedText>
        </ExternalLink>
      </Collapsible>

      {/* Contact Details Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeContactModal}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            {selectedContact && (
              <>
                <ThemedText type="title" style={styles.modalTitle}>
                  {selectedContact.name}
                </ThemedText>

                {selectedContact.phoneNumbers?.map((phone, index) => (
                  <ThemedText key={index} style={styles.modalPhoneNumber}>
                    {phone.number} ({phone.label})
                  </ThemedText>
                ))}

                <ThemedText style={styles.dateLabel}>
                  Payment Due Date:
                </ThemedText>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}>
                  <ThemedText style={styles.dateButtonText}>
                    {format(currentDate, 'MMMM dd, yyyy')}
                  </ThemedText>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={currentDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()} // Only allow dates today or in the future
                  />
                )}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={savePaymentDate}>
                  <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
                    Save Payment Date
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeContactModal}>
                  <ThemedText type="defaultSemiBold" style={styles.closeButtonText}>
                    Return to Contacts
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  contactItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  phoneNumber: {
    marginTop: 4,
    color: '#666',
  },
  paymentDate: {
    marginTop: 4,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 16,
  },
  noContactsText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  modalPhoneNumber: {
    marginBottom: 10,
    fontSize: 16,
  },
  dateLabel: {
    marginTop: 20,
    marginBottom: 5,
    fontSize: 16,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 20,
  },
  dateButtonText: {
    textAlign: 'center',
  },
  saveButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
  },
});
