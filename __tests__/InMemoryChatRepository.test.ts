import {InMemoryChatRepository} from '../src/features/chat/data/InMemoryChatRepository';

describe('InMemoryChatRepository', () => {
  it('sends a trimmed text message into the selected conversation', async () => {
    const repository = new InMemoryChatRepository();
    const [conversation] = await repository.listConversations();

    const sent = await repository.sendText(conversation.id, '  hello from Nook  ');
    const messages = await repository.listMessages(conversation.id);

    expect(sent.body).toBe('hello from Nook');
    expect(sent.delivery).toBe('sent');
    expect(messages.at(-1)).toEqual(sent);
  });

  it('does not leak messages into a different conversation', async () => {
    const repository = new InMemoryChatRepository();

    expect(await repository.listMessages('unknown-conversation')).toEqual([]);
  });
});
