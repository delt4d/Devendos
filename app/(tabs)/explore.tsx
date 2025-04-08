import { AppState, FlatList, Modal, StyleSheet, TouchableOpacity, View } from "react-native"
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import * as Contacts from "expo-contacts";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import DateTimePicker from '@react-native-community/datetimepicker';
import { format as formatDateFns } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

Notifications.setNotificationHandler({
  async handleNotification() {
    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowAlert: true
    }
  }
})

export default function Explore() {
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contacts.Contact | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [notificationsIds, setNotificationsIds] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [contactStatus, notificationStatus] = await Promise.all([
        Contacts.requestPermissionsAsync(),
        Notifications.requestPermissionsAsync()
      ]);

      if (contactStatus.granted) {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers]
        });

        setContacts(data);
      }

      if (notificationStatus.granted) {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        const ids: Record<string, string> = {};

        notifications.forEach(notification => {
          if (notification.content.data.contactId) {
            ids[notification.content.data.contactId] = notification.identifier;
          }
        });

        setNotificationsIds(ids);
      }
    })();

    const handleNotificationTriggered = (contactId: string) => {
      if (contactId) {
        setNotificationsIds(prev => {
          const newIds = { ...prev };
          delete newIds[contactId];
          return newIds;
        });
      }
    };

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        Notifications.getPresentedNotificationsAsync().then((notifications) => {
          notifications.forEach(notification => {
            console.log("Notification received while inactive:", notification);
            if (notification.request.content.data.contactId) {
              handleNotificationTriggered(notification.request.content.data.contactId);
            }
          });
        });
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received:", notification);
      handleNotificationTriggered(notification.request.content.data.contactId);
    });

    return () => {
      subscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  function handleDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(false);

    if (!selectedDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate >= today) {
      setCurrentDate(selectedDate);
    }
  }

  function openContactModal(contact: Contacts.Contact) {
    setSelectedContact(contact);
    setIsModalVisible(true);
  }

  function closeContactModal() {
    setIsModalVisible(false);
    setSelectedContact(null);
  }

  async function savePaymentDate() {
    if (!selectedContact) return;

    try {
      if (notificationsIds[selectedContact.id!]) {
        // if notification for contact exists, remove it
        await Notifications.cancelScheduledNotificationAsync(notificationsIds[selectedContact.id!]);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Lembrete de pagamento',
          body: `Hoje é o prazo máximo de ${selectedContact.name || 'Contato sem Nome'}`,
          data: { contactId: selectedContact.id! },
          interruptionLevel: 'timeSensitive',
        },
        trigger: {
          date: currentDate,
          type: Notifications.SchedulableTriggerInputTypes.DATE
        },
      });

      setNotificationsIds(prev => ({
        ...prev,
        [selectedContact.id!]: notificationId
      }))

      closeContactModal();
    }
    catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  async function removePaymentDate() {
    if (!selectedContact) return;
    try {
      await cancelNotification(selectedContact.id!);
      closeContactModal();
    }
    catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async function cancelNotification(contactId: string) {
    if (!notificationsIds[contactId]) return;
    await Notifications.cancelScheduledNotificationAsync(notificationsIds[contactId]);
    const newIds = { ...notificationsIds };
    delete newIds[contactId];
    setNotificationsIds(newIds);
  }

  function renderContactItem({ item }: { item: Contacts.Contact }) {
    const hasNotification = !!notificationsIds[item.id!];

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
            Data do Lembrete Definida
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
                Remover
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    );
  }

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

      <ThemedText>
        {JSON.stringify(notificationsIds)}
      </ThemedText>

      {contacts.length > 0 ? (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id!}
          scrollEnabled={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <ThemedText style={styles.noContactsText}>Nenhum contato encontrado</ThemedText>
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
                    {formatDateFns(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </ThemedText>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={currentDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={savePaymentDate}>
                  <ThemedText type="defaultSemiBold" style={styles.saveButtonText}>
                    {notificationsIds[selectedContact.id!] ? 'Atualizar Lembrete' : 'Definir Lembrete'}
                  </ThemedText>
                </TouchableOpacity>

                {notificationsIds[selectedContact.id!] && (
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
  )
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
