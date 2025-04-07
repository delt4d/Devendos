import { StyleSheet, FlatList, View, TouchableOpacity, Modal } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Contacts from 'expo-contacts';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function TabTwoScreen() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contacts.Contact | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notificationIds, setNotificationIds] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      // Request permissions for contacts and notifications
      const [contactsStatus, notificationStatus] = await Promise.all([
        Contacts.requestPermissionsAsync(),
        Notifications.requestPermissionsAsync(),
      ]);

      if (contactsStatus.status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        if (data.length > 0) {
          setContacts(data);
        }
      }

      // Load scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const ids: Record<string, string> = {};
      scheduledNotifications.forEach(notification => {
        if (notification.content.data.contactId) {
          ids[notification.content.data.contactId] = notification.identifier;
        }
      });
      setNotificationIds(ids);
    })();
  }, []);

  const openContactModal = (contact: Contacts.Contact) => {
    // Check if this contact already has a scheduled notification
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

  const scheduleNotification = async (contactId: string, contactName: string, date: Date) => {
    // Cancel existing notification if there is one
    if (notificationIds[contactId]) {
      await Notifications.cancelScheduledNotificationAsync(notificationIds[contactId]);
    }

    // Schedule new notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lembrete de pagamento',
        body: `Hoje é o prazo máximo de ${contactName}`,
        data: { contactId },
      },
      trigger: {
        date,
        hour: 9,
        minute: 0,
        repeats: false,
      },
    });

    // Update our local state
    setNotificationIds(prev => ({
      ...prev,
      [contactId]: notificationId,
    }));
  };

  const cancelNotification = async (contactId: string) => {
    if (notificationIds[contactId]) {
      await Notifications.cancelScheduledNotificationAsync(notificationIds[contactId]);
      const newIds = { ...notificationIds };
      delete newIds[contactId];
      setNotificationIds(newIds);
    }
  };

  const savePaymentDate = async () => {
    if (!selectedContact) return;

    try {
      await scheduleNotification(
        selectedContact.id!,
        selectedContact.name || 'Contato sem Nome',
        currentDate
      );
      closeContactModal();
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const removePaymentDate = async () => {
    if (!selectedContact) return;

    try {
      await cancelNotification(selectedContact.id!);
      closeContactModal();
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const renderContactItem = ({ item }: { item: Contacts.Contact }) => {
    const hasNotification = !!notificationIds[item.id!];

    return (
      <ThemedView style={styles.contactItem}>
        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
        {item.phoneNumbers?.map((phone, index) => (
          <ThemedText key={index} style={styles.phoneNumber}>
            {phone.number}
          </ThemedText>
        ))}
        {hasNotification && (
          <ThemedText style={styles.paymentDate}>
            Payment reminder set
          </ThemedText>
        )}
        <View style={styles.contactActions}>
          <TouchableOpacity onPress={() => openContactModal(item)}>
            <ThemedText type="link">
              {hasNotification ? 'Atualizar Lembrete' : 'Definir Lembrete'}
            </ThemedText>
          </TouchableOpacity>
          {hasNotification && (
            <TouchableOpacity
              onPress={() => cancelNotification(item.id!)}
              style={styles.removeButton}>
              <ThemedText type="link" style={styles.removeButtonText}>
                Remove
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
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
        <ThemedText type="title">Contatos</ThemedText>
      </ThemedView>

      {contacts.length > 0 ? (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id!}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <ThemedText style={styles.noContactsText}>No contacts found</ThemedText>
      )}

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
                  Data do Lembrete:
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
                    locale={ptBR}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={savePaymentDate}>
                  <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
                    {notificationIds[selectedContact.id!] ? 'Atualizar Lembrete' : 'Definir Lembrete'}
                  </ThemedText>
                </TouchableOpacity>

                {notificationIds[selectedContact.id!] && (
                  <TouchableOpacity
                    style={styles.removeButtonModal}
                    onPress={removePaymentDate}>
                    <ThemedText type="defaultSemiBold" style={styles.removeButtonTextModal}>
                      Remover Lembrete
                    </ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeContactModal}>
                  <ThemedText type="defaultSemiBold" style={styles.closeButtonText}>
                    Retornar aos Contatos
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
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  removeButton: {
    marginLeft: 16,
  },
  removeButtonText: {
    color: '#f44336',
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
  removeButtonModal: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f44336',
    borderRadius: 5,
    alignItems: 'center',
  },
  removeButtonTextModal: {
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
