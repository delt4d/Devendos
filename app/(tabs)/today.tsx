import { StyleSheet, FlatList, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Contacts from 'expo-contacts';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';

export default function TodayScreen() {
    const [dueContacts, setDueContacts] = useState<{ contact: Contacts.Contact, dueDate: Date }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDueContacts = async () => {
            try {
                // Get all scheduled notifications
                const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

                // Get contacts
                const { status } = await Contacts.requestPermissionsAsync();
                if (status !== 'granted') return;

                const { data: contacts } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers],
                });

                // Filter notifications that are due today or tomorrow
                const now = new Date();
                const dueItems = [];

                for (const notification of scheduledNotifications) {
                    if (!notification.trigger.date) continue;

                    const triggerDate = new Date(notification.trigger.date);
                    const hoursUntilDue = differenceInHours(triggerDate, now);

                    // Include notifications due in the next 24 hours
                    if (hoursUntilDue <= 24 && hoursUntilDue >= 0) {
                        const contactId = notification.content.data.contactId;
                        const contact = contacts.find(c => c.id === contactId);

                        if (contact) {
                            dueItems.push({
                                contact,
                                dueDate: triggerDate
                            });
                        }
                    }
                }

                // Sort by due date (soonest first)
                dueItems.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
                setDueContacts(dueItems);
            } catch (error) {
                console.error('Error fetching due contacts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDueContacts();

        // Refresh every hour to keep the list up-to-date
        const interval = setInterval(fetchDueContacts, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getDueText = (date: Date) => {
        if (isToday(date)) {
            return `Today at ${format(date, 'h:mm a')}`;
        } else if (isTomorrow(date)) {
            return `Tomorrow at ${format(date, 'h:mm a')}`;
        } else {
            const hours = differenceInHours(date, new Date());
            return `In ${hours} hours (${format(date, 'MMM d, h:mm a')})`;
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Payments Due</ThemedText>

            {isLoading ? (
                <ThemedText>Loading...</ThemedText>
            ) : dueContacts.length === 0 ? (
                <ThemedView style={styles.emptyState}>
                    <IconSymbol name="checkmark.circle.fill" size={48} color="#4CAF50" />
                    <ThemedText style={styles.emptyText}>Nenhum pagamento devido nas próximas 24 horas</ThemedText>
                </ThemedView>
            ) : (
                <FlatList
                    data={dueContacts}
                    keyExtractor={(item) => item.contact.id!}
                    renderItem={({ item }) => (
                        <ThemedView style={styles.contactCard}>
                            <ThemedText type="defaultSemiBold">{item.contact.name}</ThemedText>
                            {item.contact.phoneNumbers?.map((phone, index) => (
                                <ThemedText key={index} style={styles.phoneNumber}>
                                    {phone.number}
                                </ThemedText>
                            ))}
                            <ThemedText style={styles.dueText}>
                                {getDueText(item.dueDate)}
                            </ThemedText>
                        </ThemedView>
                    )}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        marginBottom: 20,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 16,
        textAlign: 'center',
        fontSize: 16,
    },
    contactCard: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    phoneNumber: {
        marginTop: 4,
        color: '#666',
    },
    dueText: {
        marginTop: 8,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    listContainer: {
        paddingBottom: 20,
    },
});
